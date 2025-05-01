const Web3 = require('web3');
const VotingArtifact = require('../../build/contracts/Voting.json');

const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/login.html';
}

const payload = JSON.parse(atob(token.split('.')[1]));
const voterId = payload.voter_id;
const aadhaar = payload.aadhaar;
const isAdmin = payload.role === 'admin';

const adminAddress = "0x43900eF395311e18083bC1f7bfe43B584157Af3e"; // From your migration

const contractAddress = VotingArtifact.networks[1337] && VotingArtifact.networks[1337].address;
if (!contractAddress) {
    console.error("Contract address not found for network ID 1337. Ensure migration was run on Ganache.");
    document.body.innerHTML = "<h1>Error: Contract not deployed. Please run 'truffle migrate --network ganache --reset'.</h1>";
    throw new Error("Contract address not found");
}

let web3;
let votingContract;

async function initWeb3() {
    try {
        if (window.ethereum) {
            web3 = new Web3(window.ethereum);
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            console.log("Connected to Metamask with accounts:", accounts);
        } else {
            const providerUrl = 'http://127.0.0.1:7545';
            web3 = new Web3(providerUrl);
            const networkId = await web3.eth.net.getId();
            console.log("Connected to Ganache directly. Network ID:", networkId);
            if (networkId != 1337) {
                throw new Error(`Expected network ID 1337, but got ${networkId}. Check Ganache settings.`);
            }
        }
        votingContract = new web3.eth.Contract(VotingArtifact.abi, contractAddress);
        const accounts = await web3.eth.getAccounts();
        web3.eth.defaultAccount = accounts[0];
        console.log("Web3 initialized. Default account:", accounts[0]);
        const balance = await web3.eth.getBalance(adminAddress);
        console.log(`Admin address balance: ${web3.utils.fromWei(balance, 'ether')} ETH`);
        console.log("Using contract address:", contractAddress);
        const admin = await votingContract.methods.admin().call();
        console.log("Contract admin:", admin);
    } catch (error) {
        console.error("Web3 initialization failed:", error.message);
        document.body.innerHTML += `<p>Error initializing Web3: ${error.message}. Ensure Metamask or Ganache is running on port 7545 with network ID 1337.</p>`;
        throw error;
    }
}

async function fetchUserProfile() {
    try {
        const response = await fetch(`http://127.0.0.1:8000/user/${voterId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await response.json();
        if (response.ok) {
            document.getElementById('voterName').innerText = user.name || 'N/A';
            document.getElementById('voterDOB').innerText = user.dob || 'N/A';
            document.getElementById('voterAadhaar').innerText = user.aadhaar || 'N/A';
            document.getElementById('voterGender').innerText = user.gender || 'N/A';
            document.getElementById('voterPhone').innerText = user.phone || 'N/A';
            document.getElementById('voterEmail').innerText = user.email || 'N/A';
            if (user.image_hash) {
                document.getElementById('voterImage').src = `/Database_API/user_images/${user.image_hash}.png`;
            }
            console.log("User profile fetched:", user);
        } else {
            console.error('Fetch user failed:', user.detail);
            document.getElementById('registrationStatus').innerText = `Error: ${user.detail}`;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        document.getElementById('registrationStatus').innerText = 'Error loading profile';
    }
}

async function fetchCandidates() {
    try {
        console.log("Fetching candidates...");
        const candidatesCount = await votingContract.methods.candidatesCount().call();
        console.log(`Total candidates from blockchain: ${candidatesCount}`);
        const tbody = isAdmin ? document.getElementById('resultTable') : document.getElementById('boxCandidate');
        if (!tbody) {
            console.error(`Table body not found. Expected ID: ${isAdmin ? 'resultTable' : 'boxCandidate'}.`);
            return;
        }
        tbody.innerHTML = '';
        if (candidatesCount == 0) {
            console.log("No candidates available");
            tbody.innerHTML = '<tr><td colspan="4">No candidates available</td></tr>';
            return;
        }
        for (let i = 0; i < candidatesCount; i++) {
            const candidate = await votingContract.methods.getCandidate(i).call();
            console.log(`Candidate ${i}: Name=${candidate[0]}, Party=${candidate[1]}, Votes=${candidate[2]}`);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                ${!isAdmin ? '<td><input type="radio" name="candidate" value="' + i + '"></td>' : ''}
                <td>${candidate[0]}</td>
                <td>${candidate[1]}</td>
                <td><img src="/Database_API/symbols/${i}.png?t=${new Date().getTime()}" width="50" height="50" alt="${candidate[0]}" onerror="this.src='default.png'"></td>
                <td>${candidate[2]}</td>
            `;
            tbody.appendChild(tr);
        }
        if (!isAdmin && document.getElementById('voteButton')) {
            document.getElementById('voteButton').disabled = false;
        }
        console.log("Candidates rendered successfully");
    } catch (error) {
        console.error('Error in fetchCandidates:', error.message, error.stack);
        const tbody = isAdmin ? document.getElementById('resultTable') : document.getElementById('boxCandidate');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="4">Error loading candidates: ${error.message}</td></tr>`;
        }
    }
}

async function fetchVotingStatus() {
    try {
        const status = await votingContract.methods.getVotingStatus().call();
        const startDate = new Date(status[0] * 1000).toLocaleString();
        const endDate = new Date(status[1] * 1000).toLocaleString();
        const stopped = status[2];
        const datesEl = document.getElementById('dates');
        const statusEl = document.getElementById('emergencyStatus');
        if (datesEl) datesEl.innerText = `Voting Period: ${startDate} to ${endDate}`;
        if (statusEl) statusEl.innerText = stopped ? 'Emergency Stopped' : 'Voting Active';
        console.log("Voting status:", { start: startDate, end: endDate, stopped });
        return { start: status[0], end: status[1], stopped };
    } catch (error) {
        console.error('Error fetching voting status:', error);
        const datesEl = document.getElementById('dates');
        if (datesEl) datesEl.innerText = 'Status unavailable';
    }
}

async function castVote(candidateId) {
    try {
        const status = await fetchVotingStatus();
        if (status.stopped || Date.now() / 1000 < status.start || Date.now() / 1000 > status.end) {
            throw new Error('Voting is not currently allowed');
        }
        await votingContract.methods.vote(candidateId, aadhaar).send({ from: web3.eth.defaultAccount });
        document.getElementById('msg').innerText = 'Vote cast successfully!';
        document.getElementById('msg').classList.add('text-success');
        console.log(`Voted for candidate ${candidateId}`);
        fetchCandidates();
    } catch (error) {
        console.error('Vote error full details:', error);
        console.log('Raw error message:', error.message);
        console.log('Error data:', error.data); // Log additional error details
        console.log('Error stack:', error.stack);
        let errorMsg;
        // Broader check for "already voted" in various formats
        const errorString = JSON.stringify(error); // Convert error object to string for broader matching
        if (errorString.includes("You have already voted") || 
            (error.message && error.message.includes("revert")) || 
            (error.data && error.data.message && error.data.message.includes("revert"))) {
            errorMsg = "Already voted";
        } else if (error.message.includes("Voting is not currently allowed")) {
            errorMsg = "Voting is not currently allowed";
        } else {
            errorMsg = "An unexpected error occurred. Please try again.";
            console.log("Unhandled error full object:", error); // Log entire error object
        }
        document.getElementById('msg').innerText = errorMsg;
        document.getElementById('msg').classList.add('text-danger');
    }
}

async function addCandidate(name, party, symbolFile) {
    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts[0].toLowerCase() !== adminAddress.toLowerCase()) {
            throw new Error('Only admin wallet can add candidates');
        }
        console.log(`Adding candidate: ${name}, ${party}`);
        await votingContract.methods.addCandidate(name, party).send({ from: accounts[0] });
        const formData = new FormData();
        formData.append('name', name);
        formData.append('party', party);
        formData.append('symbol', symbolFile);
        const response = await fetch('http://127.0.0.1:8000/add_candidate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            document.getElementById('Aday').innerText = 'Candidate added successfully!';
            document.getElementById('Aday').classList.add('text-success');
            console.log("Candidate added to backend:", result);
            await fetchCandidates();
        } else {
            throw new Error(result.detail || 'Failed to add candidate to backend');
        }
    } catch (error) {
        console.error('Add candidate error:', error);
        document.getElementById('Aday').innerText = `Error: ${error.message}`;
        document.getElementById('Aday').classList.add('text-danger');
    }
}

async function setVotingDates(start, end) {
    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts[0].toLowerCase() !== adminAddress.toLowerCase()) {
            throw new Error('Only admin wallet can set dates');
        }
        await votingContract.methods.setVotingDates(start, end).send({ from: accounts[0] });
        document.getElementById('AdayDates').innerText = 'Dates set successfully!';
        document.getElementById('AdayDates').classList.add('text-success');
        console.log(`Dates set: ${start} to ${end}`);
        fetchVotingStatus();
    } catch (error) {
        console.error('Set dates error:', error);
        document.getElementById('AdayDates').innerText = `Error: ${error.message}`;
        document.getElementById('AdayDates').classList.add('text-danger');
    }
}

async function toggleEmergencyStop() {
    try {
        const accounts = await web3.eth.getAccounts();
        if (accounts[0].toLowerCase() !== adminAddress.toLowerCase()) {
            throw new Error('Only admin wallet can toggle emergency stop');
        }
        await votingContract.methods.toggleEmergencyStop().send({ from: accounts[0] });
        document.getElementById('stopStatus').innerText = 'Emergency stop toggled!';
        document.getElementById('stopStatus').classList.add('text-success');
        console.log("Emergency stop toggled");
        fetchVotingStatus();
    } catch (error) {
        console.error('Toggle stop error:', error);
        document.getElementById('stopStatus').innerText = `Error: ${error.message}`;
        document.getElementById('stopStatus').classList.add('text-danger');
    }
}

if (isAdmin) {
    const candidateForm = document.getElementById('candidateForm');
    if (candidateForm) {
        candidateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const party = document.getElementById('party').value;
            const symbol = document.getElementById('symbol').files[0];
            await addCandidate(name, party, symbol);
            candidateForm.reset();
        });
    }

    const addDateBtn = document.getElementById('addDate');
    if (addDateBtn) {
        addDateBtn.addEventListener('click', async () => {
            const start = Math.floor(new Date(document.getElementById('startDate').value).getTime() / 1000);
            const end = Math.floor(new Date(document.getElementById('endDate').value).getTime() / 1000);
            await setVotingDates(start, end);
        });
    }

    const toggleStopBtn = document.getElementById('toggleStop');
    if (toggleStopBtn) {
        toggleStopBtn.addEventListener('click', async () => {
            await toggleEmergencyStop();
        });
    }
} else {
    const voteButton = document.getElementById('voteButton');
    if (voteButton) {
        voteButton.addEventListener('click', () => {
            const selected = document.querySelector('input[name="candidate"]:checked');
            if (selected) {
                castVote(selected.value);
            } else {
                document.getElementById('msg').innerText = 'Please select a candidate';
                document.getElementById('msg').classList.add('text-warning');
            }
        });
    }
}

const accountAddressEl = document.getElementById('accountAddress');
if (accountAddressEl) {
    accountAddressEl.innerText = `Logged in as: ${voterId}`;
}

initWeb3().then(() => {
    fetchUserProfile();
    fetchCandidates();
    fetchVotingStatus();
}).catch(error => {
    console.error('Web3 initialization failed:', error);
    document.body.innerHTML += `<p>Error initializing Web3: ${error.message}. Ensure Metamask or Ganache is running.</p>`;
});
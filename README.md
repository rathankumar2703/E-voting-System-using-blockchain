>npm --version
9.9.4
>python --version
Python 3.9.0
>node --version
v18.14.0
>npm list
shiva@ C:\Users\shiva
+-- @openzeppelin/contracts@4.9.3
+-- @truffle/contract@4.6.31
+-- crypto-js@4.2.0
+-- dotenv@16.4.7
+-- express@4.21.2
+-- git@0.1.5
+-- mongoose@7.8.6
+-- solc@0.8.21
+-- truffle@5.11.5
`-- web3@4.16.0
>>npm list -g
C:\Users\shiva\AppData\Roaming\npm
+-- browserify@17.0.1
+-- ganache@7.9.1
+-- npm@9.9.4
+-- truffle@5.11.5
`-- yarn@1.22.19

Decentralized-Voting-System-Main
The Decentralized Voting System is a secure, transparent, and modern solution for conducting elections. Built with Ethereum blockchain technology for tamper-proof voting records and FastAPI with MySQL for user management, this system allows voters to cast votes remotely while ensuring authenticity, security, and transparency. This project combines a robust backend, an intuitive frontend, and blockchain integration for a trustless voting process.
PS: This is an active work-in-progress project, and contributions or feedback are welcome!
Features
JWT Authentication: Secure voter login and authorization using JSON Web Tokens (JWT).
Ethereum Blockchain: Tamper-proof voting records stored on a local Ganache blockchain via a Solidity smart contract (Voting.sol).
MySQL Database: User registration and profile management with image uploads stored in the filesystem.
Frontend Interface: Intuitive UI for voter registration, login, and voting, served via Express.js.
Admin Capabilities: Partial admin functionality to view candidates (adding candidates via blockchain not yet fully integrated).
Cross-Origin Support: FastAPI backend configured with CORS to communicate with the frontend seamlessly.
Current Functional Components
User Registration: Register with voter ID, password, personal details, and an image (stored in Database_API/user_images/).
User Login: Authenticate with voter ID and password, redirecting to the voting page.
Blockchain Voting: Vote for candidates stored on the Ethereum blockchain using the Voting.sol contract.
Candidate Display: View candidates and their vote counts from the blockchain on the voter page.
Profile Display: Registered user details and uploaded image displayed on the voting page.
Requirements
Node.js: Version 18.14.0
Python: Version 3.9 or higher
MySQL: Port 3306 (standalone MySQL, not XAMPP)
Ganache: Local Ethereum blockchain
Truffle: For compiling and migrating Solidity contracts
Metamask: Browser extension for blockchain interaction (optional for local testing)
FastAPI: Backend API framework
Screenshots
(Note: Replace these placeholders with actual screenshots of your running app once captured.)

Login Page: [Login Screenshot Placeholder]
Voter Page: [Voter Screenshot Placeholder]
Registration Page: [Registration Screenshot Placeholder]
Installation
Open a Terminal
Ensure you have Git, Node.js, Python, MySQL, and Ganache installed.
Clone the Repository
text



git clone <your-repo-url>  # Replace with your repo URL if hosted
If not hosted, use your local folder: cd C:\Users\shiva\Downloads\Decentralized-Voting-System-main\Decentralized-Voting-System-main
Install Ganache
Download and install Ganache.
Open Ganache, create a new workspace named development, and add truffle-config.js from the project root by clicking "Add Project."
Install Metamask (Optional for Local Testing)
Download the Metamask extension.
Create a wallet and import Ganache accounts (copy private keys from Ganache UI).
Add network: Name: Localhost 8545, RPC URL: http://localhost:8545, Chain ID: 1337, Currency: ETH.
Set Up MySQL
Open MySQL terminal:
text



mysql -u root -p
Create database:
sql



DROP DATABASE IF EXISTS voting_db;
CREATE DATABASE voting_db;
The main.py script will auto-create tables (users and candidates) on startup.
Install Truffle Globally
text



npm install -g truffle
Install Node.js Dependencies
In the project root:
text



npm install
Install Python Dependencies
In the Database_API/ folder:
text



cd Database_API
pip install fastapi mysql-connector-python pydantic python-dotenv uvicorn pyjwt python-multipart
Usage
Note: Update the MySQL password in Database_API/main.py under db_config with your root password.
Start Ganache
Open Ganache, select the development workspace, and ensure it’s running on 127.0.0.1:8545 (Network ID: 1337).
Compile and Migrate Smart Contracts
In the project root terminal:
text



truffle compile --reset
truffle migrate --network ganache --reset
Note the Voting contract address from the output (e.g., 0x...).
Bundle JavaScript
In the project root:
text



browserify src/js/register.js -o src/dist/register.js
browserify src/js/login.js -o src/dist/login.js
browserify src/js/app.js -o src/dist/app.js
Start the Node.js Server
In the project root:
text



node index.js
Output: Server running on http://localhost:8080
Start the FastAPI Server
In another terminal:
text



cd Database_API
uvicorn main:app --reload --port 8000
Output: Uvicorn running on http://127.0.0.1:8000
Access the App
Open a browser and go to http://localhost:8080/.
Register a user, log in, and vote for candidates.
Code Structure
text



Decentralized-Voting-System-main/
├── contracts/                     # Solidity smart contracts
│   ├── Migrations.sol
│   └── Voting.sol
├── migrations/                    # Truffle migration scripts
│   ├── 1_initial_migration.js
│   └── 2_deploy_voting.js
├── Database_API/                  # FastAPI backend
│   ├── main.py
│   ├── symbols/                   # Stores candidate symbol images
│   └── user_images/               # Stores voter profile images
├── src/                           # Frontend source files
│   ├── css/
│   │   └── styles.css
│   ├── dist/                      # Bundled JS files
│   │   ├── register.js
│   │   ├── login.js
│   │   └── app.js
│   ├── html/                      # HTML templates
│   │   ├── index.html
│   │   ├── register.html
│   │   ├── login.html
│   │   ├── vote.html
│   │   └── admin_dashboard.html
│   └── js/                        # JavaScript logic
│       ├── register.js
│       ├── login.js
│       └── app.js
├── build/                         # Compiled contract artifacts (auto-generated)
│   └── contracts/
│       ├── Migrations.json
│       └── Voting.json
├── index.js                       # Express server
├── package.json                   # Node.js dependencies
└── truffle-config.js              # Truffle configuration
Functional Details
Registration: Users submit details and an image via http://localhost:8080/register.html. Data is stored in MySQL (users table), and the image goes to user_images/ with a hash.
Login: Authenticates via http://127.0.0.1:8000/login, sets a JWT in local storage, and redirects to vote.html.
Voting: Fetches candidates from the Voting contract on Ganache and allows voting. Votes are recorded on the blockchain.
Profile: Displays user data and image from FastAPI on vote.html.
Pending: Full admin functionality (adding candidates via blockchain) and voting period management.
License
This project is licensed under the MIT License. Feel free to use, modify, and distribute it with proper attribution.

If You Like This Project
Please give it a 🌟 and let me know your feedback!

Thank You 😊
We’ve made great progress—keep experimenting and building!

Notes
Screenshots: Add actual images once you capture them (e.g., via Print Screen or a tool like Snipping Tool).
Pending Features: Admin candidate management and voting dates aren’t fully blockchain-integrated yet. Let me know if you want to prioritize those next!
Testing: Try registering, logging in, and voting to confirm everything works. Report any errors here.
Let me know how this looks or if you need adjustments!

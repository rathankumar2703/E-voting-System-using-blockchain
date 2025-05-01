pragma solidity >=0.4.21 <0.7.0;

contract Voting {
    address public admin;
    uint public votingStart;
    uint public votingEnd;
    bool public emergencyStopped;

    struct Candidate {
        string name;
        string party;
        uint voteCount;
    }

    mapping(uint => Candidate) public candidates;
    mapping(string => bool) public hasVoted;
    uint public candidatesCount;

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    modifier duringVotingPeriod() {
        require(block.timestamp >= votingStart && block.timestamp <= votingEnd, "Voting period is not active");
        require(!emergencyStopped, "Voting is emergency stopped");
        _;
    }

    constructor(address _admin) public {
        admin = _admin;
        emergencyStopped = false;
    }

    function setAdmin(address _newAdmin) public onlyAdmin {
        admin = _newAdmin;
    }

    function addCandidate(string memory _name, string memory _party) public onlyAdmin {
        candidates[candidatesCount] = Candidate(_name, _party, 0);
        candidatesCount++;
    }

    function vote(uint _candidateId, string memory _aadhaar) public duringVotingPeriod {
        require(!hasVoted[_aadhaar], "You have already voted");
        require(_candidateId < candidatesCount, "Invalid candidate");
        hasVoted[_aadhaar] = true;
        candidates[_candidateId].voteCount++;
    }

    function setVotingDates(uint _start, uint _end) public onlyAdmin {
        require(_start < _end, "Start must be before end");
        votingStart = _start;
        votingEnd = _end;
    }

    function toggleEmergencyStop() public onlyAdmin {
        emergencyStopped = !emergencyStopped;
    }

    function getCandidate(uint _candidateId) public view returns (string memory, string memory, uint) {
        require(_candidateId < candidatesCount, "Invalid candidate");
        Candidate memory c = candidates[_candidateId];
        return (c.name, c.party, c.voteCount);
    }

    function getVotingStatus() public view returns (uint, uint, bool) {
        return (votingStart, votingEnd, emergencyStopped);
    }
}
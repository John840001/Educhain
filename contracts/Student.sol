// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

contract Student {
    address admin;
    address student_address;
    string description;
    string name;

    constructor(
        address _admin,
        address _student_address,
        string memory _name,
        string memory _description
    ) public {
        admin = _admin;
        name = _name;
        student_address = _student_address;
        description = _description;
    }

    modifier OnlyStudent() {
        require(msg.sender == student_address);
        _;
    }

    function getStudentInfo()
        public
        view
        returns (address, string memory, string memory)
    {
        return (student_address, name, description);
    }

    function editInfo(
        string memory _name,
        string memory _descrip
    ) public OnlyStudent {
        name = _name;
        description = _descrip;
    }
}

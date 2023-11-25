// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;

contract Teacher {
    address admin;
    string name;
    address teacher_address;
    string description;

    constructor(
        address _admin,
        address _teacher_address,
        string memory _name,
        string memory _description
    ) public {
        admin = _admin;
        name = _name;
        teacher_address = _teacher_address;
        description = _description;
    }

    modifier OnlyTeacher() {
        require(msg.sender == teacher_address, "only Teachers are allowed.");
        _;
    }

    function getTeacherInfo()
        public
        view
        returns (address, string memory, string memory)
    {
        return (teacher_address, name, description);
    }

    address[] allStudents;

    function addStudents(address student_address) public {
        // require(msg.sender == teacher_address);
        allStudents.push(student_address);
    }

    function editInfo(
        string memory _name,
        string memory _descrip
    ) public OnlyTeacher {
        name = _name;
        description = _descrip;
    }

    function totalStudents() public view returns (uint256) {
        return allStudents.length;
    }

    function getStudentByIndex(uint256 index) public view returns (address) {
        return allStudents[index];
    }

    function isStudentAssigned(address student_address) public view returns (bool) {
        for (uint256 i = 0; i < totalStudents(); i++) {
            if (allStudents[i] == student_address) {
                return true;
            }
            return false;
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;
import "./Student.sol";
import "./Teacher.sol";
import "./Educhain.sol";

contract Admin {
    address public owner;
    Educhain public educhain;

    constructor(address _educhain) {
        owner = msg.sender;
        educhain = Educhain(_educhain);
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    mapping(address => address) registeredStudentsmap;
    mapping(address => address) registeredTeachermap;
    address[] registeredStudents;
    address[] registeredTeacher;

    function registerUser(
        address EthAddress,
        string memory Name,
        string memory Description,
        uint256 Role
    ) public onlyOwner {
        if (Role == 1) {
            Student newStudent = new Student(
                owner,
                EthAddress,
                Name,
                Description
            );
            registeredStudentsmap[EthAddress] = address(newStudent);
            registeredStudents.push(EthAddress);
        } else if (Role == 2) {
            Teacher newTeacher = new Teacher(
                owner,
                EthAddress,
                Name,
                Description
            );
            registeredTeachermap[EthAddress] = address(newTeacher);
            registeredTeacher.push(EthAddress);
        }
    }

    /****************************************************************USER SECTION**************************************************/

    function isStudent(address _studentAddress) public view returns (bool) {
        return registeredStudentsmap[_studentAddress] != address(0x0);
    }

    function isTeacher(address _teacherEndorser) public view returns (bool) {
        return registeredTeachermap[_teacherEndorser] != address(0x0);
    }

    function studentCount() public view returns (uint256) {
        return registeredStudents.length;
    }

    function getStudentContractByAddress(
        address _student
    ) public view returns (address) {
        return registeredStudentsmap[_student];
    }

    function getStudentContractByIndex(
        uint256 index
    ) public view returns (address) {
        return getStudentContractByAddress(registeredStudents[index]);
    }

    function TeacherCount() public view returns (uint256) {
        return registeredTeacher.length;
    }

    function getTeacherContractByAddress(
        address _teacher
    ) public view returns (address) {
        return registeredTeachermap[_teacher];
    }

    function getTeacherContractByIndex(
        uint256 index
    ) public view returns (address) {
        return getTeacherContractByAddress(registeredTeacher[index]);
    }
}

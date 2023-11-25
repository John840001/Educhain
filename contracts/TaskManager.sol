// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0 <0.9.0;
import "./Educhain.sol";
import "./Admin.sol";
import "./Teacher.sol";

contract TaskManager {
    Educhain public educhain;
    Teacher public objTeacher;
    Admin public objAdmin;
    address public teacher;

    constructor(address _educhain, address _teacher) {
        educhain = Educhain(_educhain);
        objTeacher = Teacher(_teacher);
        objAdmin = Admin(msg.sender);
    }

    function setTeacher(address _teacherAdd) public {
        teacher = _teacherAdd;
    }

    modifier onlyTeacher() {
        require(msg.sender == teacher);
        _;
    }

    modifier onlyTeacherAfter(uint256 taskId) {
        require(
            tasks[taskId].teacher == teacher,
            "Only the assigned teacher can perform this action"
        );
        _;
    }

    modifier onlyStudent(uint256 taskId) {
        require(
            tasks[taskId].hasSubmitted[msg.sender],
            "Only the assigned student can perform this action"
        );
        _;
    }

    struct Task {
        uint256 taskId;
        address teacher;
        string taskDescription;
        bool isOpen;
        mapping(address => bool) hasSubmitted;
        mapping(address => string) answers;
        mapping(address => uint256) grades;
    }

    mapping(uint256 => Task) public tasks;
    uint256 public totalTasks;

    event TaskAssigned(uint256 taskId, address teacher, string taskDescription);
    event AnswerSubmitted(uint256 taskId, address student, string answer);
    event TaskGraded(uint256 taskId, address student, uint256 grade);

    function assignTask(
        // uint256 taskId,
        string memory taskDescription
    ) public onlyTeacher {
        totalTasks++;
        Task storage newTask = tasks[totalTasks];
        newTask.taskId = totalTasks;
        newTask.teacher = msg.sender; // Use the calling teacher's address
        newTask.taskDescription = taskDescription;
        newTask.isOpen = true;

        // Initialize mappings for the given taskId
        initializeMappings(totalTasks);

        emit TaskAssigned(totalTasks, msg.sender, taskDescription);
    }

    function addStudent(address student_address) public onlyTeacher {
        objTeacher.addStudents(student_address);
    }

    function initializeMappings(uint256 taskId) internal {
        // Initialize mappings for the given taskId
        for (uint256 i = 0; i < objTeacher.totalStudents(); i++) {
            address student = objTeacher.getStudentByIndex(i);
            tasks[taskId].hasSubmitted[student] = false;
            tasks[taskId].answers[student] = "";
            tasks[taskId].grades[student] = 0;
        }
    }

    function submitAnswer(uint256 taskId, string memory answer) public {
        require(
            objTeacher.isStudentAssigned(msg.sender),
            "Student is not assigned to this task"
        );
        require(tasks[taskId].isOpen, "Task is not open for submission");
        require(
            !tasks[taskId].hasSubmitted[msg.sender],
            "Task already submitted"
        );

        tasks[taskId].answers[msg.sender] = answer;
        tasks[taskId].hasSubmitted[msg.sender] = true;

        emit AnswerSubmitted(taskId, msg.sender, answer);
    }

    function gradeTask(
        uint256 taskId,
        address student,
        uint256 grade
    ) public onlyTeacherAfter(taskId) {
        require(!tasks[taskId].isOpen, "Task is still open for submission");
        require(
            tasks[taskId].hasSubmitted[student],
            "Student has not submitted the task"
        );
        require(
            tasks[taskId].grades[student] == 0,
            "Task already graded for this student"
        );

        tasks[taskId].grades[student] = grade;

        educhain.mint(student, grade);

        emit TaskGraded(taskId, student, grade);
    }

    function closeTask(uint256 taskId) public onlyTeacherAfter(taskId) {
        tasks[taskId].isOpen = false;
    }

    function getTaskInfo(
        uint256 taskId
    )
        public
        view
        returns (
            address teacherAddress,
            string memory taskDescription,
            bool isOpen,
            address students,
            bool submissions,
            string memory answers,
            uint256 grades
        )
    {
        Task storage task = tasks[taskId];

        teacherAddress = task.teacher;
        taskDescription = task.taskDescription;
        isOpen = task.isOpen;

        for (uint256 i = 0; i < objTeacher.totalStudents(); i++) {
            students = objTeacher.getStudentByIndex(i);
            submissions = task.hasSubmitted[students];
            answers = task.answers[students];
            grades = task.grades[students];
        }

        return (
            teacherAddress,
            taskDescription,
            isOpen,
            students,
            submissions,
            answers,
            grades
        );
    }

    function getAnswer(
        uint256 taskId
    ) public view onlyStudent(taskId) returns (string memory) {
        return tasks[taskId].answers[msg.sender];
    }

    function getGrade(
        uint256 taskId
    ) public view onlyStudent(taskId) returns (uint256) {
        return tasks[taskId].grades[msg.sender];
    }

    function isTaskOpen(uint256 taskId) public view returns (bool) {
        return tasks[taskId].isOpen;
    }
}

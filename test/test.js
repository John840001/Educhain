const { ethers } = require("hardhat");
const { expect } = require("chai");

const taskManagerJSON = require("..//artifacts/contracts/TaskManager.sol/TaskManager.json");

describe("1. Educhain Contract Tests:", function () {
  let Educhain, educhain, owner, addr1;
  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    Educhain = await ethers.getContractFactory("Educhain");
    educhain = await Educhain.deploy();
  });
  it("Test 1: Should have the correct name and symbol", async function () {
    expect(await educhain.name()).to.equal("Educhain");
    expect(await educhain.symbol()).to.equal("EDC");
  });

  it("Test 2: Should assign the initial supply to the owner", async function () {
    const ownerBalance = await educhain.balanceOf(owner.address);
    expect(await educhain.totalSupply()).to.equal(ownerBalance);
  });

  it("Test 3: Should allow the admin to mint tokens", async function () {
    const mintAmount = 100;
    await expect(educhain.connect(addr1).mint(addr1.address, mintAmount)).not.to
      .reverted;

    await educhain.mint(addr1.address, mintAmount);
    const addr1Balance = await educhain.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(2 * mintAmount);
  });

  it("Test 4: Should allow only the admin to transfer tokens", async function () {
    const transferAmount = 50;
    await expect(
      educhain.mint(addr1.address, transferAmount),
      await expect(
        educhain.transferFrom(addr1.address, owner.address, 20)
      ).to.be.revertedWith("ERC20: insufficient allowance")
    );

    await educhain.mint(owner.address, transferAmount);
    await educhain.connect(owner).transfer(addr1.address, transferAmount);
    const addr1Balance = await educhain.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(2 * transferAmount);
  });

  it("Test 5: Should allow other user to transfer tokens", async function () {
    const transferAmount = 50;
    await educhain.mint(addr1.address, transferAmount);
    await educhain.connect(addr1).transfer(owner.address, transferAmount);
    const addr1Balance = await educhain.balanceOf(owner.address);
    expect(addr1Balance).to.equal(transferAmount);
  });
});

describe("2. Admin Contract: ", function () {
  let admin;
  let educhain;
  let owner, student, teacher;

  beforeEach(async () => {
    const Educhain = await ethers.getContractFactory("Educhain");
    educhain = await Educhain.deploy();

    const Admin = await ethers.getContractFactory("Admin");
    admin = await Admin.deploy(educhain.address);

    [owner, student, teacher] = await ethers.getSigners();
  });

  it("Test 1: Should register a student", async function () {
    const studentName = "John Doe";
    const studentDescription = "Computer Science major";

    await admin.registerUser(
      student.address,
      studentName,
      studentDescription,
      1
    );

    const isStudent = await admin.isStudent(student.address);
    expect(isStudent).to.be.true;

    const studentContract = await admin.getStudentContractByAddress(
      student.address
    );
    expect(studentContract).to.not.equal(ethers.constants.AddressZero);
  });

  it("Test 2: should register a teacher", async function () {
    const teacherName = "Alice";
    const teacherDescription = "Mathematics Professor";

    await admin.registerUser(
      teacher.address,
      teacherName,
      teacherDescription,
      2
    );

    const isTeacher = await admin.isTeacher(teacher.address);
    expect(isTeacher).to.be.true;

    const teacherContract = await admin.getTeacherContractByAddress(
      teacher.address
    );
    expect(teacherContract).to.not.equal(ethers.constants.AddressZero);
  });

  it("Test 3: Should get student info", async function () {
    const studentName = "John Doe";
    const studentDescription = "Computer Science major";
    await admin.registerUser(
      student.address,
      studentName,
      studentDescription,
      1
    );
    const studentContractAddress = await admin.getStudentContractByAddress(
      student.address
    );
    const studentContract = await ethers.getContractAt(
      "Student",
      studentContractAddress
    );
    const studentInfo = await studentContract.getStudentInfo();
    expect(studentInfo[0]).to.equal(student.address);
    expect(studentInfo[1]).to.equal(studentName);
    expect(studentInfo[2]).to.equal(studentDescription);
  });

  it("Test 4: Should get teacher info", async function () {
    const teacherName = "Alice";
    const teacherDescription = "Mathematics Professor";
    await admin.registerUser(
      teacher.address,
      teacherName,
      teacherDescription,
      2
    );
    const teacherContractAddress = await admin.getTeacherContractByAddress(
      teacher.address
    );
    const teacherContract = await ethers.getContractAt(
      "Teacher",
      teacherContractAddress
    );
    const teacherInfo = await teacherContract.getTeacherInfo();
    expect(teacherInfo[0]).to.equal(teacher.address);
    expect(teacherInfo[1]).to.equal(teacherName);
    expect(teacherInfo[2]).to.equal(teacherDescription);
  });
});

describe("3. TaskManager Contract: ", async function () {
  let taskManager;
  let admin;
  let educhain;
  let TeacherContractAdd;
  let ownerAdd, studentAdd, teacherAdd;

  beforeEach(async function () {
    [ownerAdd, studentAdd, teacherAdd] = await ethers.getSigners();
    const Educhain = await ethers.getContractFactory("Educhain");
    educhain = await Educhain.deploy();
    await educhain.deployed();

    const Admin = await ethers.getContractFactory("Admin");
    admin = await Admin.deploy(educhain.address);
    await admin.deployed();

    await admin.registerUser(studentAdd.address, "Alice", "Student", 1);
    await admin.registerUser(teacherAdd.address, "Bob", "Teacher", 2);

    TeacherContractAdd = await admin.getTeacherContractByAddress(
      teacherAdd.address
    );

    const TaskManager = await admin.getTaskManagerByAddress(teacherAdd.address);
    taskManager = await ethers.getContractAt("TaskManager", TaskManager);
  });

  it("Test 1: Should deploy TaskManager Contract", async function () {
    expect(await taskManager.educhain()).to.equal(educhain.address);
    expect(await taskManager.objTeacher()).to.equal(TeacherContractAdd);
  });

  it("Test 2: Should assign task to student", async function () {
    const taskID = 1;
    const taskDescription = "Task Description";

    expect(await admin.isTeacher(teacherAdd.address)).to.be.true;

    await taskManager.setTeacher(teacherAdd.address);
    await taskManager.connect(teacherAdd).assignTask(taskDescription);

    const task = await taskManager.getTaskInfo(taskID);
    // console.log(task);
    expect(task[0]).to.equal(teacherAdd.address);
    expect(task[1]).to.equal(taskDescription);
    expect(task[2]).to.equal(true);
  });

  it("Test 3: Should allow student to submit answer", async function () {
    const taskID1 = 1;
    const taskID2 = 2;
    const taskDescription1 = "Task Description 1";
    const taskDescription2 = "Task Description 2";

    expect(await admin.isTeacher(teacherAdd.address)).to.be.true;
    await taskManager.setTeacher(teacherAdd.address);

    expect(await admin.isStudent(studentAdd.address)).to.be.true;
    await taskManager.connect(teacherAdd).addStudent(studentAdd.address);

    await taskManager.connect(teacherAdd).assignTask(taskDescription1);
    await taskManager.connect(teacherAdd).assignTask(taskDescription2);

    await taskManager.connect(studentAdd).submitAnswer(taskID1, "Answer");
    await taskManager.connect(studentAdd).submitAnswer(taskID2, "Answer");

    const task = await taskManager.getTaskInfo(taskID1);
    // console.log("Task Data: ",task);

    expect(task.teacherAddress).to.be.equal(teacherAdd.address);
    expect(task.taskDescription).to.be.equal(taskDescription1);
    expect(task.isOpen).to.be.equal(true);
    expect(task.students).to.equal(studentAdd.address);
    expect(task.answers).to.be.equal("Answer");
    expect(task.grades).to.be.equal(0);
  });

  it("Test 4: Should allow teacher to close task", async function () {
    const taskID1 = 1;
    const taskDescription1 = "Task Description 1";

    expect(await admin.isTeacher(teacherAdd.address)).to.be.true;
    await taskManager.setTeacher(teacherAdd.address);

    expect(await admin.isStudent(studentAdd.address)).to.be.true;
    await taskManager.connect(teacherAdd).addStudent(studentAdd.address);

    await taskManager.connect(teacherAdd).assignTask(taskDescription1);

    await taskManager.connect(studentAdd).submitAnswer(taskID1, "Answer");

    await taskManager.connect(teacherAdd).closeTask(taskID1);
    const task = await taskManager.getTaskInfo(taskID1);
    // console.log("Task Data: ",task);
    expect(task.isOpen).to.be.false;
  });

  it("Test 5: Should grade the submitted answers and update grades in tasks", async function () {
    const taskID1 = 1;
    const taskDescription1 = "Task Description 1";

    expect(await admin.isTeacher(teacherAdd.address)).to.be.true;
    await taskManager.setTeacher(teacherAdd.address);

    expect(await admin.isStudent(studentAdd.address)).to.be.true;
    await taskManager.connect(teacherAdd).addStudent(studentAdd.address);

    await taskManager.connect(teacherAdd).assignTask(taskDescription1);

    await taskManager.connect(studentAdd).submitAnswer(taskID1, "Answer");

    await taskManager.connect(teacherAdd).closeTask(taskID1);
    await taskManager
      .connect(teacherAdd)
      .gradeTask(taskID1, studentAdd.address, 10);

    let task = await taskManager.getTaskInfo(taskID1);
    // console.log("Task Data: ",task);
    expect(task.grades).to.be.equal(10);
    expect(await educhain.balanceOf(studentAdd.address)).to.be.equal(10);
  });
});

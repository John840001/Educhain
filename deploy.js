const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer, teacher] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Educhain = await ethers.getContractFactory("Educhain");
  const educhain = await Educhain.deploy();
  await educhain.deployed();
  console.log("Educhain deployed to:", educhain.address);

  const Admin = await ethers.getContractFactory("Admin");
  const admin = await Admin.deploy(educhain.address);
  await admin.deployed();
  console.log("Admin deployed to:", admin.address);

  await admin.registerUser(teacher.address, "Unik Lokhande", "Teacher", 2);
  const teacherContract = await admin.getTeacherContractByAddress(
    teacher.address
  );
  console.log("Teacher Contract deployed to:", teacherContract);

  const TeacherContractAdd = await admin.getTeacherContractByAddress(
    teacher.address
  );

  const TaskManager = await ethers.getContractFactory("TaskManager");
  const taskManager = await TaskManager.deploy(
    educhain.address,
    TeacherContractAdd
  );
  await taskManager.deployed();
  console.log("TaskManager deployed to:", taskManager.address);

  const contractAddressData = {
    educhainAddress: educhain.address,
    adminAddress: admin.address,
    teacherContractAddress: teacherContract,
    taskManagerAddress: taskManager.address,
  };

  fs.writeFileSync(
    "./artifacts/contracts/contractAddress.json",
    JSON.stringify(contractAddressData)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

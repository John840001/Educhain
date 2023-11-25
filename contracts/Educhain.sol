// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Educhain is ERC20 {
    address public admin;

    constructor() ERC20("Educhain", "EDC") {
        admin = msg.sender;
    }

    function setAdmin(address _admin) external {
        require(msg.sender == admin, "Not authorized to set admin");
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

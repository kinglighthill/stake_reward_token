// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract StakeRewardToken is ERC20, Ownable {
    using SafeMath for uint256;

    uint256 _tokensPerEther = 1000;

    address[] internal stakeholders;
    mapping (address => uint256) internal stakes;
    mapping (address => uint256) internal rewards;

    constructor() ERC20("StakeRewardToken", "SRT") {
        _mint(msg.sender, convertToDecimals(1000));
    }

    function modifyTokenBuyPrice(uint256 rate) public onlyOwner {
        _tokensPerEther = rate;
    }

    function tokensPerEther() public view returns(uint256) {
        return _tokensPerEther;
    }

    function buyToken() public payable {
        uint256 tokens = msg.value * _tokensPerEther;
        _mint(msg.sender, tokens);
    }

    function stakeToken(uint256 _stake) public {
        uint256 stake = convertToDecimals(_stake);
        _transfer(msg.sender, owner(), stake);
        _approve(owner(), msg.sender, stake);
        if (stakes[msg.sender] == 0) {
            addStakeHolder(msg.sender);
        }
        stakes[msg.sender] = stakes[msg.sender].add(stake);
    }

    function unstakeToken(uint256 _stake) public returns(bool) {
        uint256 stake = convertToDecimals(_stake);
        stakes[msg.sender] = stakes[msg.sender].sub(stake);
        if (stakes[msg.sender] == 0) {
            removeStakeHolder(msg.sender);
        }
        _transfer(owner(), msg.sender, stake);
        _approve(owner(), msg.sender, stakes[msg.sender]);
        return true;
    }

    function stakeOf(address _stakeholder) public view returns(uint256) {
        return stakes[_stakeholder];
    }


    function isStakeHolder(address _stakeholder) public view returns(bool, uint256) { 
        for (uint256 i = 0; i < stakeholders.length; i++) {
            if (_stakeholder == stakeholders[i]) return (true, i);
        }

        return (false, 0);
    }

    function totalStakes() public view returns(uint256) {
        uint256 _totalStakes = 0;
        for (uint256 i = 0; i < stakeholders.length; i++) {
            _totalStakes = _totalStakes.add(stakes[stakeholders[i]]);
        }

        return _totalStakes;
    }

    function totalStakeHolders() public view returns(uint256) {
        return stakeholders.length;
    }

    function addStakeHolder(address _stakeholder) internal {
        (bool _isStakeholder, ) = isStakeHolder(_stakeholder);
        if (!_isStakeholder) {
            stakeholders.push(_stakeholder);
        }
    }

    function removeStakeHolder(address _stakeholder) internal {
        (bool _isStakeholder, uint position) = isStakeHolder(_stakeholder);
        if (_isStakeholder) {
            stakeholders[position] = stakeholders[stakeholders.length - 1];
            stakeholders.pop();
        }
    }

    function mintReward(address _stakeholder) internal view onlyOwner returns(uint256) {
        return stakes[_stakeholder] / 100;
    }

    function rewardStakeHolders() public onlyOwner {
        for (uint256 i = 0; i < stakeholders.length; i++) {
            address stakeholder = stakeholders[i];
            uint256 reward = mintReward(stakeholder);
            rewards[stakeholder] = reward;
        }
    }

    function rewardOf(address _stakeholder) public view returns(uint256) {
        return rewards[_stakeholder];
    }

    function claimReward() public returns (bool) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "You must have a reward to claim");
        transferFrom(owner(), msg.sender, rewards[msg.sender]);
        rewards[msg.sender] = 0;
        return true;
    }
 
    function convertToDecimals(uint256 value) private view returns(uint256) {
        return value * 10 ** decimals(); 
    }
}
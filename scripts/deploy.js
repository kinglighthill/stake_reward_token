const { ethers } = require("hardhat")
const hre = require("hardhat")

async function main() {
    const stakeRewardTokenContract = await ethers.getContractFactory("StakeRewardToken")
    const StakeRewardToken = await stakeRewardTokenContract.deploy()
    await StakeRewardToken.deployed()

    // await verifyContract(StakeRewardToken.address);
    
    console.log("Contract deployed to address: ", StakeRewardToken.address)
}

async function verifyContract(_address) {
    let contructor_arguments = [];
  
    verify = await hre.run("verify:verify", {
      address: _address,
      constructorArguments: contructor_arguments,
    });
    console.log(`successfuly verified`);
    return verify;
}

const runMain = async () => {
    try {
        await main()
        process.exit(0)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

runMain()
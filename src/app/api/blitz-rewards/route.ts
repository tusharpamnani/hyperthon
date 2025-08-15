import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import basedQuizABI from "../../../abi/BasedQuiz.json";

// token address = 0x587A253330826dDE12A91f9071084575B865E855
// quiz address = 0x2049581cb5169881FAE7ed568465b97B51F7Dc6E

const BASED_QUIZ_ADDRESS = "0x2049581cb5169881FAE7ed568465b97B51F7Dc6E"; // Placeholder
const BASE_RPC_URL = process.env.API_URL;

// Health check endpoint
export async function GET() {
  console.log("🏥 Blitz-rewards health check called");

  try {
    const hasOwnerKey = !!process.env.PRIVATE_KEY;
    const ownerKeyLength = process.env.PRIVATE_KEY?.length;

    let ownerAddress = "Not available";
    let networkStatus = "Not tested";
    let balanceInfo = "Not checked";

    if (hasOwnerKey) {
      try {
        const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
        const signer = new ethers.Wallet(
          process.env.PRIVATE_KEY!,
          provider
        );
        ownerAddress = signer.address;

        const balance = await provider.getBalance(signer.address);
        const balanceEth = ethers.formatEther(balance);
        balanceInfo = `${balanceEth} ETH`;
        networkStatus = "Connected";
      } catch (error: any) {
        networkStatus = `Error: ${error.message}`;
      }
    }

    return NextResponse.json({
      status: "healthy",
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasOwnerPrivateKey: hasOwnerKey,
        ownerKeyLength: ownerKeyLength
          ? `${ownerKeyLength} characters`
          : "Not set",
        ownerAddress,
        networkStatus,
        ownerBalance: balanceInfo,
        basedQuizContractAddress: BASED_QUIZ_ADDRESS,
        rpcUrl: BASE_RPC_URL,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("🚀 Blitz-rewards API called at:", new Date().toISOString());

  try {
    // Parse and validate request body
    const requestBody = await request.json();
    const { address, quizId, isCorrect, answer, salt, timeSpent, socialShare } = requestBody;

    console.log("📋 Request details:", {
      address: address
        ? `${address.slice(0, 6)}...${address.slice(-4)}`
        : "undefined",
      quizId,
      isCorrect,
      timeSpent,
      socialShare: !!socialShare,
      answer: answer ? `${answer.slice(0, 20)}...` : "undefined",
      salt: salt ? `${salt.slice(0, 10)}...` : "undefined",
      requestBody: JSON.stringify(requestBody),
    });

    // Validate input
    if (!address || quizId === undefined || isCorrect === undefined) {
      console.error("❌ Invalid request body:", {
        address: !!address,
        quizId,
        isCorrect,
      });
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid request data: address, quizId, and isCorrect required",
        },
        { status: 400 }
      );
    }

    // Validate address format
    if (!ethers.isAddress(address)) {
      console.error("❌ Invalid address format:", address);
      return NextResponse.json(
        { success: false, message: "Invalid wallet address format" },
        { status: 400 }
      );
    }

    // Check for owner private key
    const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
    if (!ownerPrivateKey) {
      console.error(
        "❌ CRITICAL: OWNER_PRIVATE_KEY not set in environment variables"
      );
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error: missing owner key",
        },
        { status: 500 }
      );
    }

    console.log("🔧 Environment check passed - private key available");

    // Set up provider and signer
    console.log("🌐 Connecting to Base mainnet...");
    const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
    const signer = new ethers.Wallet(ownerPrivateKey, provider);

    console.log("👛 Owner wallet address:", signer.address);

    // Verify network connection and get owner balance
    try {
      const network = await provider.getNetwork();
      const balance = await provider.getBalance(signer.address);
      const balanceEth = ethers.formatEther(balance);

      console.log("🌐 Network connection verified:", {
        chainId: network.chainId.toString(),
        name: network.name,
        ownerBalance: `${balanceEth} ETH`,
        balanceWei: balance.toString(),
      });

      if (parseFloat(balanceEth) < 0.001) {
        console.error(
          "❌ CRITICAL: Owner wallet has insufficient ETH for gas!"
        );
        return NextResponse.json(
          {
            success: false,
            message: `Owner wallet low on ETH: ${balanceEth} ETH (need ~0.001+ ETH for gas)`,
          },
          { status: 500 }
        );
      }
    } catch (networkError: any) {
      console.error("❌ Network connection failed:", networkError);
      return NextResponse.json(
        {
          success: false,
          message: "Network connection failed: " + networkError.message,
        },
        { status: 503 }
      );
    }

    // Create contract instance
    console.log("📋 Creating contract instance...");
    const contract = new ethers.Contract(
      BASED_QUIZ_ADDRESS,
      basedQuizABI,
      signer
    );
    console.log("📋 Contract instance created:", {
      address: contract.target,
      hasDistributeBlitzRewards: typeof contract.distributeBlitzRewards === "function",
      hasAwardSocialShareBonus: typeof contract.awardSocialShareBonus === "function",
    });

    // Verify contract owner (optional debugging step)
    try {
      const contractOwner = await contract.owner();
      console.log("🏛️ Contract owner verification:", {
        contractOwner,
        signerAddress: signer.address,
        isOwner: contractOwner.toLowerCase() === signer.address.toLowerCase(),
      });

      if (contractOwner.toLowerCase() !== signer.address.toLowerCase()) {
        console.error("❌ CRITICAL: Signer is not the contract owner!");
        return NextResponse.json(
          { success: false, message: "Server error: unauthorized signer" },
          { status: 500 }
        );
      }
    } catch (ownerCheckError: any) {
      console.error("⚠️ Owner check failed (non-critical):", ownerCheckError.message);
      // Continue execution - this is not a critical error
    }

    // Handle social share bonus if requested
    if (socialShare) {
      console.log("🔄 Processing social share bonus for", address);
      
      // Estimate gas for the transaction
      console.log("⛽ Estimating gas for awardSocialShareBonus transaction...");
      let gasEstimate;
      try {
        gasEstimate = await contract.awardSocialShareBonus.estimateGas(address);
        console.log("⛽ Gas estimate:", gasEstimate.toString());
      } catch (gasError: any) {
        console.error("❌ Gas estimation failed:", gasError.message);
        console.error("❌ Gas estimation error details:", {
          code: gasError.code,
          reason: gasError.reason,
          data: gasError.data,
        });
        return NextResponse.json(
          {
            success: false,
            message: "Gas estimation failed: " + gasError.message,
          },
          { status: 500 }
        );
      }

      // Call awardSocialShareBonus function
      console.log("📞 Calling awardSocialShareBonus on contract...");
      const txParams = {
        gasLimit: Math.max(Number(gasEstimate) * 2, 200000), // Use 2x estimate with minimum 200k
      };
      console.log("📞 Transaction parameters:", txParams);

      const tx = await contract.awardSocialShareBonus(address, txParams);

      console.log("⏳ Transaction submitted:", {
        hash: tx.hash,
        nonce: tx.nonce,
        gasLimit: tx.gasLimit?.toString(),
        gasPrice: tx.gasPrice?.toString(),
      });

      // Wait for confirmation
      console.log("⏳ Waiting for transaction confirmation...");
      const receipt = await tx.wait();

      const processingTime = Date.now() - startTime;

      console.log("✅ Transaction confirmed successfully:", {
        hash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        status: receipt.status,
        processingTimeMs: processingTime,
      });

      console.log(
        `🎉 Successfully awarded social share bonus to ${address}`
      );

      return NextResponse.json({
        success: true,
        message: "Social share bonus awarded!",
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        quizId,
        playerAddress: address,
        rewardType: "socialShareBonus",
        gasUsed: receipt.gasUsed?.toString(),
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      });
    }

    // Calculate Based Score components
    let basedScore = 0;
    let speedBonus = 0;
    let streakBonus = 0;
    
    if (isCorrect) {
      // Base points for correct answer
      basedScore = 10;
      
      // Speed bonus
      if (timeSpent < 2) {
        speedBonus = 5; // <2s: +5
      } else if (timeSpent < 5) {
        speedBonus = 3; // 2-5s: +3
      } else if (timeSpent < 10) {
        speedBonus = 1; // 5-10s: +1
      }
      
      // Get current streak from contract
      try {
        const streak = await contract.getStreak(address);
        streakBonus = Number(streak) * 2; // +2 per consecutive correct answer
        
        // Perfect streak bonus (10 correct answers)
        if (Number(streak) === 10) {
          streakBonus += 20; // +20 for perfect 10/10
        }
      } catch (streakError) {
        console.error("⚠️ Failed to get streak (using 0):", streakError);
      }
      
      basedScore += speedBonus + streakBonus;
    }

    // Calculate reward amount based on Based Score
    const baseReward = isCorrect ? 5 : 1; // 5 tokens base for correct, 1 for participation
    const scaledReward = isCorrect ? (basedScore * baseReward) / 10 : baseReward;
    const rewardAmount = scaledReward * Math.pow(10, 18); // Convert to wei

    // Estimate gas for the transaction
    console.log("⛽ Estimating gas for distributeBlitzRewards transaction...");
    let gasEstimate;
    try {
      gasEstimate = await contract.distributeBlitzRewards.estimateGas(
        quizId,
        [address]
      );
      console.log("⛽ Gas estimate:", gasEstimate.toString());
    } catch (gasError: any) {
      console.error("❌ Gas estimation failed:", gasError.message);
      console.error("❌ Gas estimation error details:", {
        code: gasError.code,
        reason: gasError.reason,
        data: gasError.data,
      });
      return NextResponse.json(
        {
          success: false,
          message: "Gas estimation failed: " + gasError.message,
        },
        { status: 500 }
      );
    }

    // Call distributeBlitzRewards function
    console.log("📞 Calling distributeBlitzRewards on contract...");
    const txParams = {
      gasLimit: Math.max(Number(gasEstimate) * 2, 200000), // Use 2x estimate with minimum 200k
    };
    console.log("📞 Transaction parameters:", txParams);

    const tx = await contract.distributeBlitzRewards(
      quizId,
      [address],
      txParams
    );

    console.log("⏳ Transaction submitted:", {
      hash: tx.hash,
      nonce: tx.nonce,
      gasLimit: tx.gasLimit?.toString(),
      gasPrice: tx.gasPrice?.toString(),
    });

    // Wait for confirmation
    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await tx.wait();

    const processingTime = Date.now() - startTime;

    console.log("✅ Transaction confirmed successfully:", {
      hash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed?.toString(),
      status: receipt.status,
      processingTimeMs: processingTime,
    });

    const resultMessage = isCorrect
      ? `Based! Awarded ${scaledReward} $BLITZ tokens with Based Score: ${basedScore}`
      : `Not based this time, but awarded ${baseReward} $BLITZ tokens for participation`;

    console.log(
      `🎉 Successfully awarded ${scaledReward} $BLITZ tokens to ${address} for quiz ${quizId}`
    );

    return NextResponse.json({
      success: true,
      message: resultMessage,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      quizId,
      isCorrect,
      playerAddress: address,
      basedScore,
      speedBonus,
      streakBonus,
      rewardAmount: scaledReward,
      gasUsed: receipt.gasUsed?.toString(),
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("❌ Blitz rewards FAILED after", processingTime, "ms");
    console.error("❌ Error details:", {
      message: error.message,
      code: error.code,
      reason: error.reason,
      data: error.data,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        success: false,
        message: "Reward processing failed: " + error.message,
        error: {
          code: error.code,
          reason: error.reason,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
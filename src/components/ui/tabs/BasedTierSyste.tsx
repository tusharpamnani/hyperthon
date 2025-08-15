"use client";

import { useState, useEffect } from 'react';

interface BasedTierSystemProps {
  basedScore: number;
  showTitle?: boolean;
  showBadge?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

interface TierInfo {
  title: string;
  emoji: string;
  color: string;
  minScore: number;
  maxScore: number;
}

// Based Tier definitions
const BASED_TIERS: TierInfo[] = [
  { title: 'Paperhand NPC', emoji: '🤖', color: 'text-gray-500', minScore: 0, maxScore: 20 },
  { title: 'Normie', emoji: '👶', color: 'text-blue-300', minScore: 21, maxScore: 40 },
  { title: 'Crypto Curious', emoji: '🧐', color: 'text-green-400', minScore: 41, maxScore: 60 },
  { title: 'Semi-Based', emoji: '💻', color: 'text-yellow-500', minScore: 61, maxScore: 80 },
  { title: 'Based Enjoyooor', emoji: '😎', color: 'text-orange-500', minScore: 81, maxScore: 100 },
  { title: 'Onchain Warrior', emoji: '🦾', color: 'text-purple-500', minScore: 101, maxScore: 120 },
  { title: 'Sigma Maximalist', emoji: '⚡', color: 'text-pink-600', minScore: 121, maxScore: 999 },
];

export default function BasedTierSystem({ basedScore, showTitle = true, showBadge = false, size = 'md' }: BasedTierSystemProps) {
  const [currentTier, setCurrentTier] = useState<TierInfo | null>(null);
  const [percentBased, setPercentBased] = useState<number>(0);

  useEffect(() => {
    // Find the appropriate tier based on score
    const tier = BASED_TIERS.find(
      (tier) => basedScore >= tier.minScore && basedScore <= tier.maxScore
    ) || BASED_TIERS[BASED_TIERS.length - 1]; // Default to highest tier if score exceeds all tiers
    
    setCurrentTier(tier);
    
    // Calculate percentage based (max 100%)
    const calculatedPercent = Math.min(Math.round((basedScore / 150) * 100), 100);
    setPercentBased(calculatedPercent);
  }, [basedScore]);

  if (!currentTier) return null;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  // Badge component for sharing
  const BasedBadge = () => (
    <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-4 rounded-lg shadow-lg max-w-md mx-auto text-center">
      <div className="text-white text-xl font-bold mb-2">
        I&apos;m {percentBased}% Based
      </div>
      <div className={`${currentTier.color} text-2xl font-bold flex items-center justify-center gap-2`}>
        <span>{currentTier.title}</span>
        <span className="text-3xl">{currentTier.emoji}</span>
      </div>
      <div className="text-gray-200 text-xs mt-3">
        basedquiz.xyz
      </div>
    </div>
  );

  return (
    <div className={`${sizeClasses[size]} font-bold`}>
      {showTitle && (
        <div className={`flex items-center gap-1 ${currentTier.color}`}>
          <span>{currentTier.title}</span>
          <span>{currentTier.emoji}</span>
        </div>
      )}
      
      {showBadge && <BasedBadge />}
    </div>
  );
}
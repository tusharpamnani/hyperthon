export const metadata = {
  title: "BasedBlitz",
  description: "A Farcaster frame for BasedBlitz fun!",
  openGraph: {
    title: "BasedBlitz",
    images: ["https://hyperthon-flame.vercel.app/image.png"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://hyperthon-flame.vercel.app/image.png",
    "fc:frame:button:1": "Play Now",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://hyperthon-flame.vercel.app/",
  },
};

export default function FramePage() {
  // Nothing to render, only metadata for Warpcast to read
  return null;
}
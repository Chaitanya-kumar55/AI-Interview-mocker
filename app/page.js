import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="text-center p-4">
      <h2 className="text-xl font-bold mb-4">Welcome to My New Project</h2>
      
      {/* Link to Dashboard */}
      <Link href="/dashboard">
        <Button>Go to Dashboard</Button>
      </Link>
    </div>
  );
}

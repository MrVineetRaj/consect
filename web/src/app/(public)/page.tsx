import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";

const LandingPage = () => {
  return (
    <div>
      <Link href={"/auth"}>
        <Button>Auth Page</Button>
      </Link>
    </div>
  );
};

export default LandingPage;

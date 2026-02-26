"use client"

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const Page = () => {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/signin");
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  return null;
}

export default Page
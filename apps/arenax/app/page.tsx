"use client"

import { useRouter } from 'next/navigation';

const page = () => {

  const router = useRouter();

  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/signin")
  }
  return (
    router.push("/dashboard")
  )
}

export default page
import { redirect } from "next/navigation"

const page = () => {
    return (
        redirect("/signup")
    )
}

export default page
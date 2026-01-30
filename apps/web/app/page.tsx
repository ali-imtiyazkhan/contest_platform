import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const page = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("refreshToken");

    console.log("token is ", token)

    if (token) {
        redirect("/dashboard");
    }

    redirect("/signup");
};

export default page;

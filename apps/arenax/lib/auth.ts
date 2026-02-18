// import { jwtDecode } from "jwt-decode";
// import { BACKEND_URL } from "@/config";
// import axios from "axios";

// type JwtPayload = {
//   exp?: number;
// };


// export const getAuthStateSSR = async () => {
//   try {
//     const response = await axios.post(
//       `${BACKEND_URL}/api/v1/user/refresh`,
//       {},
//       {
//         withCredentials: true,
//       },
//     );

//     if (response.status === 200) {
//       return {
//         accessToken: response.data.accessToken,
//         user: response.data.user,
//       };
//     }
//   } catch (error) {
//     console.log("getAuthStateSSR Error:", error);
//     return null;
//   }
// };

// /**
//  * ✅ Extract token expiration
//  */
// export const getTokenExpiration = (token: string) => {
//   try {
//     const decoded = jwtDecode<JwtPayload>(token);
//     return decoded.exp ? decoded.exp * 1000 : null;
//   } catch (error) {
//     console.log("getTokenExpiration Error:", error);
//     return null;
//   }
// };

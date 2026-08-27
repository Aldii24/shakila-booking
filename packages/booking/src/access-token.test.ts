import { describe,expect,it } from "vitest";
import { issueBookingAccessToken,verifyBookingAccessToken } from "./access-token.js";
const secret="a-secure-test-secret-that-is-long-enough";
describe("booking access token",()=>{it("is booking and scope bound",()=>{const token=issueBookingAccessToken({bookingId:"8f887852-7403-472a-ae23-43f19f19fbea",bookingCode:"GLP-260825-001201",scopes:["booking:read"]},secret);expect(verifyBookingAccessToken(token,secret,"GLP-260825-001201","booking:read").bookingId).toBe("8f887852-7403-472a-ae23-43f19f19fbea");expect(()=>verifyBookingAccessToken(token,secret,"JEP-260825-001201","booking:read")).toThrow(/out of scope/);});});

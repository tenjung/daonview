export const generateBizVerificationPrompt = (companyName: string, bizNumber: string) => {
    return `
You are a professional business document inspector. 
Please analyze the attached business registration certificate (사업자등록증) and verify if it matches the information provided by the user.

[User Provided Information]
- Company Name: ${companyName}
- Business Registration Number: ${bizNumber}

[Verification Rules]
1. Exact Match for Business Number: The registration number in the document (사업자등록번호) must match the provided number exactly (ignoring hyphens).
2. Soft Match for Company Name: The name in the document (상호 또는 법인명) should reasonably match the provided name. Allow for minor variations like whitespace or presence of "(주)", "주식회사".
3. Validity: Check if the document appears to be a valid Korean Business Registration Certificate.

[Output Format]
Return ONLY a valid JSON object in the following format:
{
  "isMatch": boolean,
  "extractedCompanyName": "string",
  "extractedBizNumber": "string",
  "confidence": number,
  "reason": "string (in Korean explaining the result)"
}
`;
};

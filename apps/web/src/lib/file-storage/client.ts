export async function uploadFileToSignedURL(signedURL: string, file: File) {
    const response = await fetch(signedURL, {
        method: 'PUT',
        headers: {
            'Content-Type': file.type,
            'Content-Length': file.size.toString(),
        },
        body: file,
    });
    if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
    }
    return response;
}

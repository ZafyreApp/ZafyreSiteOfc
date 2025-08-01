export async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_PRESET)

  const response = await fetch(import.meta.env.VITE_CLOUDINARY_URL, {
    method: 'POST',
    body: formData
  })

  const data = await response.json()
  return data.secure_url
}

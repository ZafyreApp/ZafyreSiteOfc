export const fazerUploadImagem = async (arquivo) => {
  const url = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`
  const formData = new FormData()
  formData.append('file', arquivo)
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)

  const resposta = await fetch(url, {
    method: 'POST',
    body: formData,
  })

  const dados = await resposta.json()
  return dados.secure_url
}

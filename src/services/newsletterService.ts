const SIBFORMS_ENDPOINT = 'https://3ce65bdb.sibforms.com/serve/MUIFABFDn-iEhyhEuoYqBibtROhyIT-jsLBOjKqgjhfMkKIWipaEI2AUGRJG_J31U3dBa8NyCdHuCvIWwCExG5DgEVrwlUN9Njuc9z5_LM9Ier-DxrQWegEUJOTr8lkE0mU6OcYiseh9RkMHFTBNvZM4CjJni4ger5vwm5664ivkyeG7K6aT3dapJTMeWhHzc9cP3Uot3bATGW54Qg=='

export async function subscribeToNewsletter(email: string): Promise<void> {
  try {
    const formData = new FormData()
    formData.append('EMAIL', email)
    await fetch(SIBFORMS_ENDPOINT, {
      method: 'POST',
      body: formData,
      mode: 'no-cors',
    })
  } catch {
    // Newsletter subscription is best-effort — don't block checkout on failure
  }
}

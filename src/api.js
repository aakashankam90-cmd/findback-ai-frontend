
const API_BASE_URL = "http://localhost:8080/api";

export async function getItems(type = "ALL") {
  const endpoint =
    type === "ALL"
      ? "/items"
      : type === "LOST"
        ? "/items/lost"
        : "/items/found";

  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`Failed to load items (${response.status})`);
  }

  return response.json();
}

export async function createItem(item) {
  const response = await fetch(`${API_BASE_URL}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });

  if (!response.ok) {
    throw new Error(`Failed to create item (${response.status})`);
  }

  return response.json();
}

export async function getMatches(lostItemId) {
  const response = await fetch(
    `${API_BASE_URL}/matches/${encodeURIComponent(lostItemId)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to load matches (${response.status})`);
  }

  return response.json();
}

export async function uploadItemImage(itemId, file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(
    `${API_BASE_URL}/items/${encodeURIComponent(itemId)}/image`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`Image upload failed (${response.status})`);
  }

  return response.json();
}


export async function submitClaim(claim) {
  const response = await fetch(`${API_BASE_URL}/claims`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(claim),
  });

  if (!response.ok) {
    throw new Error(`Claim submission failed (${response.status})`);
  }

  return response.json();
}

export async function requestClaimOtp(claimId, email) {
  const response = await fetch(
    `${API_BASE_URL}/claims/${encodeURIComponent(claimId)}/request-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactValue: email }),
    }
  );

  if (!response.ok) {
    throw new Error(`OTP request failed (${response.status})`);
  }

  return response.json();
}

export async function verifyClaimOtp(claimId, email, otp) {
  const response = await fetch(
    `${API_BASE_URL}/claims/${encodeURIComponent(claimId)}/verify-otp`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contactValue: email, otp }),
    }
  );

  if (!response.ok) {
    throw new Error(`OTP verification failed (${response.status})`);
  }

  return response.json();
}




export async function getPendingClaims(authHeader) {
  const response = await fetch(`${API_BASE_URL}/claims/pending`, {
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load pending claims (${response.status})`);
  }

  return response.json();
}

export async function reviewClaim(claimId, decision, authHeader) {
  const response = await fetch(
    `${API_BASE_URL}/claims/${encodeURIComponent(claimId)}/review`,
    {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ decision }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Failed to review claim (${response.status})`
    );
  }

  return response.json();
}

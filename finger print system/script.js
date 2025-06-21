// IndexedDB setup for storing fingerprint credentials
let db;
const request = indexedDB.open("FingerprintDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore("credentials", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
};

// Function to register fingerprint
async function registerFingerprint() {
    try {
        const publicKeyCredentialCreationOptions = {
            challenge: new Uint8Array(32),
            rp: { name: "Fingerprint Auth" },
            user: {
                id: new Uint8Array(16),
                name: "user@example.com",
                displayName: "User",
            },
            pubKeyCredParams: [{ type: "public-key", alg: -7 }],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                requireResidentKey: false,
                userVerification: "preferred",
            },
            timeout: 60000,
            attestation: "none",
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions,
        });

        saveCredential(credential);
        document.getElementById("status").innerText = "Fingerprint registered successfully!";
    } catch (error) {
        console.error("Error registering fingerprint:", error);
        document.getElementById("status").innerText = "Fingerprint registration failed!";
    }
}

// Function to save credential to IndexedDB
function saveCredential(credential) {
    let transaction = db.transaction(["credentials"], "readwrite");
    let objectStore = transaction.objectStore("credentials");
    objectStore.add({ id: credential.id, rawId: credential.rawId, type: credential.type });
}

// Function to authenticate fingerprint
async function authenticateFingerprint() {
    try {
        let transaction = db.transaction(["credentials"], "readonly");
        let objectStore = transaction.objectStore("credentials");
        let request = objectStore.openCursor();

        request.onsuccess = async function(event) {
            let cursor = event.target.result;
            if (cursor) {
                const publicKeyCredentialRequestOptions = {
                    challenge: new Uint8Array(32),
                    allowCredentials: [{
                        id: new Uint8Array(cursor.value.rawId),
                        type: "public-key",
                    }],
                    userVerification: "preferred",
                    timeout: 60000,
                };

                const assertion = await navigator.credentials.get({
                    publicKey: publicKeyCredentialRequestOptions,
                });

                if (assertion) {
                    document.getElementById("status").innerText = "Fingerprint authentication successful!";
                } else {
                    document.getElementById("status").innerText = "Authentication failed!";
                }
            } else {
                document.getElementById("status").innerText = "No fingerprint registered!";
            }
        };
    } catch (error) {
        console.error("Authentication error:", error);
        document.getElementById("status").innerText = "Authentication failed!";
    }
}

// Event listeners
document.getElementById("registerBtn").addEventListener("click", registerFingerprint);
document.getElementById("authenticateBtn").addEventListener("click", authenticateFingerprint);

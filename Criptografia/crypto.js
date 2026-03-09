// Criptografia simples com senha - Exemplos de uso
// NOTA: Estas funções devem ser chamadas dentro de funções async
/*
async function exemploCripto() {
  const token = await CryptoKit.encryptWithPass("texto", "senha");
  const texto = await CryptoKit.decryptWithPass(token, "senha");

  // Guardar um valor criptografado no localStorage
  await CryptoKit.setSecureItem("minha_chave", "valor", "senha");
  // Recuperar
  const valor = await CryptoKit.getSecureItem("minha_chave", "senha");
}
*/

// Assinatura ECDSA P-256 - Exemplo de uso
/*
async function exemploAssinatura() {
  const kp = await CryptoKit.genSign();
  const data = new TextEncoder().encode("mensagem");
  const sig = await CryptoKit.signBytes(data, kp.privateKey);
  const ok = await CryptoKit.verifyBytes(sig, data, kp.publicKey);
}
*/const CryptoKit=(()=>{const te=new TextEncoder();const td=new TextDecoder();function b64e(a){let s="";for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);let b=typeof btoa!=="undefined"?btoa(s):Buffer.from(s,"binary").toString("base64");return b.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function b64d(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";let str=typeof atob!=="undefined"?atob(s):Buffer.from(s,"base64").toString("binary");const out=new Uint8Array(str.length);for(let i=0;i<str.length;i++)out[i]=str.charCodeAt(i);return out}function rnd(n){const a=new Uint8Array(n);crypto.getRandomValues(a);return a}async function derive(pass,salt,it=250000){const base=await crypto.subtle.importKey("raw",te.encode(pass),{name:"PBKDF2"},false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:it,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}async function encWithKey(plain,key,iv){const ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,te.encode(plain));return new Uint8Array(ct)}async function decWithKey(ct,key,iv){const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv},key,ct);return td.decode(pt)}async function encryptWithPass(plain,pass){const salt=rnd(16);const iv=rnd(12);const key=await derive(pass,salt);const ct=await encWithKey(plain,key,iv);return "v1."+b64e(salt)+"."+b64e(iv)+"."+b64e(new Uint8Array(ct))}async function decryptWithPass(token,pass){if(typeof token!=="string"||!token.startsWith("v1."))throw new Error("invalid");const parts=token.split(".");if(parts.length!==4)throw new Error("invalid");const salt=b64d(parts[1]);const iv=b64d(parts[2]);const ct=b64d(parts[3]);const key=await derive(pass,salt);return decWithKey(ct,key,iv)}async function setSecureItem(name,value,pass){const t=await encryptWithPass(value,pass);localStorage.setItem("secure:"+name,t)}async function getSecureItem(name,pass){const t=localStorage.getItem("secure:"+name);if(!t)return null;try{return await decryptWithPass(t,pass)}catch(e){return null}}async function genSign(){return crypto.subtle.generateKey({name:"ECDSA",namedCurve:"P-256"},true,["sign","verify"])}async function signBytes(data,priv){return new Uint8Array(await crypto.subtle.sign({name:"ECDSA",hash:"SHA-256"},priv,data))}async function verifyBytes(sig,data,pub){return crypto.subtle.verify({name:"ECDSA",hash:"SHA-256"},pub,sig,data)}async function exportJwk(k){return crypto.subtle.exportKey("jwk",k)}async function importPrivJwk(jwk){return crypto.subtle.importKey("jwk",jwk,{name:"ECDSA",namedCurve:"P-256"},true,["sign"])}async function importPubJwk(jwk){return crypto.subtle.importKey("jwk",jwk,{name:"ECDSA",namedCurve:"P-256"},true,["verify"])}async function encryptJson(obj,pass){return encryptWithPass(JSON.stringify(obj),pass)}async function decryptJson(token,pass){const s=await decryptWithPass(token,pass);return JSON.parse(s)}return{b64e,b64d,randomBytes:rnd,derive,encryptWithPass,decryptWithPass,setSecureItem,getSecureItem,genSign,signBytes,verifyBytes,exportJwk,importPrivJwk,importPubJwk,encryptJson,decryptJson}})();if(typeof window!=="undefined"){window.CryptoKit=CryptoKit}

// config.js — ustawienia źródła danych.
//
// apiToken: token z CloudKit Console (kontener iCloud.com.xmslyz.FidesCuenta →
// Tokens & Keys → API Tokens, Allowed Origins = https://xmslyz.github.io).
// Token jest jawny z założenia — chroni go lista dozwolonych adresów, a dane
// chroni logowanie Apple ID. Pusty token = tryb przykładowy (bez iCloud).
// Adres z ?demo zawsze pokazuje dane przykładowe.

window.FCConfig = {
  apiToken: "95823b6bc4d3377d3f27068f80fdb04e309e55b87f0b9d010b000f622c0a5139",
  environment: "production",
};

/**
 * Trame de points de la carte du Bénin.
 *
 * Échantillonnage des contours de beninMap.ts sur une grille régulière, calculé
 * à la compilation : aucune bibliothèque cartographique, aucune requête réseau,
 * et les points partagent la projection Mercator des pins de centres.
 *
 * Les points sont groupés en anneaux concentriques autour de Cotonou, du plus
 * proche au plus lointain. Un anneau se dessine avec un seul `<path>`, ce qui
 * ramène 1237 points à 36 nœuds du DOM et permet d'animer l'apparition
 * avec un stagger, sans créer un millier de tweens.
 *
 * Chaque point tient en deux caractères — sa colonne et sa ligne dans la
 * grille — plutôt qu'en coordonnées complètes : 2.4 Ko au lieu de ~55.
 * `bandToPath()` les redéveloppe en attribut `d`.
 *
 * Généré par un script — ne pas éditer à la main.
 */

/** Fenêtre de la carte, dans le repère de projection de beninMap.ts. */
export const DOTS_VIEW_BOX = {"x":14,"y":5,"width":71,"height":90} as const

const ORIGIN = {"x":15.1,"y":6.1}
const STEP = 2.2
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Anneaux du Bénin, de Cotonou vers le nord. */
export const BENIN_BANDS: readonly string[] = [
  "QjPkQkRkSkOlPlQlRl",
  "PhQhRhShNiOiPiQiRiSiNjOjPjRjSjNkOkNl",
  "OfPfQfRfSfMgNgOgPgQgRgSgMhNhOhMiMj",
  "NdOdPdQdRdSdMeNeOePeQeReMfNf",
  "PaQaRaMbNbObPbQbRbSbMcNcOcPcQcRcMd",
  "NYOYPYQYRYSYMZNZOZPZQZRZSZMaNaOa",
  "MWNWOWPWQWRWSWMXNXOXPXQXRXSXMY",
  "QTRTLUMUNUOUPUQURUSUTUUUMVNVOVPVQVRVSVTVUV",
  "NRORPRQRRRSRTRLSMSNSOSPSQSRSSSTSUSVSLTMTNTOTPTSTTTUT",
  "MPNPOPPPQPRPSPTPUPVPKQLQMQNQOQPQQQRQSQTQUQVQWQXQLRMRURVR",
  "KNLNMNNNONPNQNRNSNTNUNVNWNIOJOKOLOMONOOOPOQOROSOTOUOVOWOXOJPKPLPWPXP",
  "OKPKQKRKSKJLKLLLMLNLOLPLQLRLSLTLULVLWLXLHMIMJMKMLMMMNMOMPMQMRMSMTMUMVMWMXMYMHNINJNXNYN",
  "MINIOIPIQIRISITIUIVIJJKJLJMJNJOJPJQJRJSJTJUJVJWJXJIKJKKKLKMKNKTKUKVKWKXKILYL",
  "QGRGSGTGUGVGWGPHQHRHSHTHUHVHWHLIWI",
  "RESETEUERFSFTFUFVF",
  "SCRDSDTD",
  "",
  ""
]

/** Mêmes anneaux pour les pays limitrophes, dessinés en retrait. */
export const NEIGHBOUR_BANDS: readonly string[] = [
  "Sl",
  "TiTjUjTkUkMlTl",
  "TfTgUgLhThUhVhLiUiViWiKjLjVjWjKkLkVkWkKlLlKmLm",
  "TdUdLeTeUeVeKfLfUfVfWfJgKgLgVgWgXgJhKhWhXhYhIiJiKiXiYiIjJjXjYjZjIkJkXkYkZkIlJlImJmIn",
  "TbUbVbKcLcScTcUcVcWcJdKdLdVdWdXdYdIeJeKeWeXeYeZeHfIfJfXfYfZfHgIgYgZgagGhHhIhZhahGiHiZiaibiGjHjajbjFkGkHkakbkFlGlHlalblFmGmHmGnHnGoHo",
  "TYLZTZUZVZWZJaKaLaTaUaVaWaXaYaIbJbKbLbWbXbYbZbHcIcJcXcYcZcacGdHdIdZdadbdFeGeHeaebeFfGfafbfcfEgFgGgbgcgEhFhbhchdhDiEiFicidiDjEjFjcjdjDkEkckdkDlElcldlDmEmdmDnEnFnDoEoFo",
  "TWUWVWJXKXLXTXUXVXWXXXIYJYKYLYUYVYWYXYYYZYGZHZIZJZKZXZYZZZaZFaGaHaIaZaaabaFbGbHbabbbcbEcFcGcbcccdcDdEdFdcdddDeEecedeeeCfDfEfdfefCgDgdgegfgBhChDhehfhBiCieifiBjCjejfjBkCkekfkBlClelflBmCmemfmBnCnenfnBoCo",
  "VUWUIVJVKVLVVVWVXVYVHWIWJWKWLWWWXWYWZWaWFXGXHXIXYXZXaXbXEYFYGYHYaYbYcYDZEZFZbZcZdZCaDaEacadaeaCbDbEbdbebfbBcCcDcecfcBdCdedfdAeBeCefeAfBfffAgBgAhAiAjAkAlAmAnAo",
  "KSWSXSHTITJTKTVTWTXTYTZTGUHUIUJUKUXUYUZUaUbUEVFVGVHVZVaVbVcVDWEWFWGWbWcWdWCXDXEXcXdXeXfXBYCYDYdYeYfYAZBZCZeZfZAaBafaAbBbAcAd",
  "IQJQYQGRHRIRJRKRXRYRZRaRFSGSHSISJSYSZSaSbScSDTETFTGTaTbTcTdTCUDUEUFUcUdUeUfUBVCVDVdVeVfVAWBWCWeWfWAXBXAY",
  "HOYOZOFPGPHPIPYPZPaPbPDQEQFQGQHQZQaQbQcQdQCRDRERFRbRcRdReRfRBSCSDSdSeSfSATBTCTeTfTAUBUAV",
  "GMZMaMENFNGNZNaNbNcNCODOEOFOGOaObOcOdOeOBPCPDPEPcPdPePfPAQBQCQeQfQARBRAS",
  "IJYJZJFKGKHKYKZKaKbKDLELFLGLHLZLaLbLcLdLBMDMEMFMbMcMdMeMfMANBNCNDNdNeNfNAOBOfOAP",
  "KGLGMGNGOGPGHHIHJHKHLHMHNHOHXHYHZHaHEIFIGIHIIIJIKIXIYIZIaIbIcICJDJEJFJGJHJaJbJcJdJeJfJAKBKCKDKEKcKdKeKfKALBLCLeLfLAM",
  "JEKELEMENEOEPEQEVEWEXEYEFFGFHFIFJFKFLFMFNFOFPFQFWFXFYFZFaFbFDGEGFGGGHGIGJGYGZGaGbGcGdGeGBHCHDHEHFHGHbHcHdHeHfHAIBICIDIdIeIfIAJBJ",
  "NBOBPBQBRBSBTBUBHCICJCKCLCMCNCOCPCQCRCTCUCVCWCXCYCZCEDFDGDHDIDJDKDLDMDNDODPDQDUDVDWDXDYDZDaDbDcDCEDEEEFEGEHEIEZEaEbEcEdEeEfEAFBFCFDFEFcFdFeFfFAGBGCGfGAH",
  "GAHAIAJAKALAMANAOAPAQARASATAUAVAWAXAYAZAaADBEBFBGBHBIBJBKBLBMBVBWBXBYBZBaBbBcBdBBCCCDCECFCGCaCbCcCdCeCfCADBDCDDDdDeDfDAEBE",
  "AABACADAEAFAbAcAdAeAfAABBBCBeBfBAC"
]

/**
 * Développe un anneau en attribut `d`.
 *
 * Chaque point est un sous-chemin de longueur nulle (`M x y h0`) : avec
 * `stroke-linecap="round"`, le navigateur le rend comme un disque. Un seul
 * élément suffit donc pour tout l'anneau, et le diamètre se pilote ensuite avec
 * `stroke-width`.
 */
export function bandToPath(band: string) {
  let path = ''

  for (let index = 0; index < band.length; index += 2) {
    const x = ORIGIN.x + ALPHABET.indexOf(band[index]) * STEP
    const y = ORIGIN.y + ALPHABET.indexOf(band[index + 1]) * STEP
    path += `M${x.toFixed(1)} ${y.toFixed(1)}h0`
  }

  return path
}

export function extractFromCasXml(xml) {
  const userName = xml.match(/<cas:user>(.*?)<\/cas:user>/)?.[1];
  const displayName = xml.match(/<cas:displayName>(.*?)<\/cas:displayName>/)?.[1];
  return { userName, displayName };
}

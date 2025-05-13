export function extractFromCasXml(xml) {
  const user = xml.match(/<cas:user>(.*?)<\/cas:user>/)?.[1];
  const displayName = xml.match(/<cas:displayName>(.*?)<\/cas:displayName>/)?.[1];
  return { user, displayName };
}

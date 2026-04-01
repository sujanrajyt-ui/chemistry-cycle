export default function handler(req, res) {
  const subject = req.query.subject;

  const files = (global.filesDB || []).filter(
    (f) => f.subject === subject
  );

  res.json(files);
}

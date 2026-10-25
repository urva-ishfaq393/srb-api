const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

module.exports = { isObjectId };

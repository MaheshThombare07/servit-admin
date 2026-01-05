import Joi from 'joi';
import { db } from '../lib/firebase.js';

const servicesCol = () => db().collection('services');

// Validation Schemas
const categorySchema = Joi.object({
  category: Joi.string().valid('men', 'women').required(),
  isActive: Joi.boolean().default(true)
});

const subServiceSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').default(''),
  unit: Joi.string().valid('per service', 'per unit', 'per hour', 'per day').default('per service'),
  minPrice: Joi.number().min(0).default(0),
  maxPrice: Joi.number().min(Joi.ref('minPrice')).default(Joi.ref('minPrice'))
});

const serviceSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('').default(''),
  icon: Joi.string().allow('').default(''),
  isActive: Joi.boolean().default(true),
  subServices: Joi.array().items(subServiceSchema).default([])
});

// Helpers
function safeId(str) {
  // Keep Firestore doc ids readable; allow spaces as seen in images
  return str.trim();
}

function nowMs() { return Date.now(); }

function normalizeSubServices(ss) {
  if (!ss) return [];
  if (Array.isArray(ss)) return ss;
  if (typeof ss === 'object') {
    return Object.entries(ss).map(([name, rest]) => ({ name, ...(rest || {}) }));
  }
  return [];
}

// Categories CRUD
export async function listCategories(_req, res) {
  const snap = await servicesCol().get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json(items);
}

export async function createCategory(req, res) {
  const { value, error } = categorySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  // Use deterministic document IDs that match your existing structure
  const resolvedId = value.category === 'men' ? 'menservices' : 'womenservices';

  const data = { category: value.category, isActive: value.isActive, createdAt: nowMs() };
  await servicesCol().doc(resolvedId).set(data, { merge: true });
  const doc = await servicesCol().doc(resolvedId).get();
  res.status(201).json({ id: resolvedId, ...doc.data() });
}

export async function updateCategory(req, res) {
  const { categoryId } = req.params;
  const { value, error } = Joi.object({ isActive: Joi.boolean(), category: Joi.string().valid('men','women') }).validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  await servicesCol().doc(categoryId).set(value, { merge: true });
  const doc = await servicesCol().doc(categoryId).get();
  if (!doc.exists) return res.status(404).json({ error: 'Category not found' });
  res.json({ id: doc.id, ...doc.data() });
}

export async function deleteCategory(req, res) {
  const { categoryId } = req.params;
  await servicesCol().doc(categoryId).delete();
  res.json({ ok: true });
}

// Services CRUD under category
function serviceCollectionRef(categoryId) {
  return servicesCol().doc(categoryId).collection('serviceList');
}

export async function listServices(req, res) {
  const { categoryId } = req.params;
  const snap = await serviceCollectionRef(categoryId).get();
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  res.json(items);
}

export async function createService(req, res) {
  const { categoryId } = req.params;
  const { value, error } = serviceSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const id = safeId(value.name);
  const data = { ...value, name: id, createdAt: nowMs() };
  await serviceCollectionRef(categoryId).doc(id).set(data);
  res.status(201).json({ id, ...data });
}

export async function getService(req, res) {
  const { categoryId, serviceId } = req.params;
  const doc = await serviceCollectionRef(categoryId).doc(serviceId).get();
  if (!doc.exists) return res.status(404).json({ error: 'Service not found' });
  const data = doc.data();
  const subServices = normalizeSubServices(data.subServices);
  res.json({ id: doc.id, ...data, subServices });
}

export async function updateService(req, res) {
  const { categoryId, serviceId } = req.params;
  const { value, error } = serviceSchema.fork(['name'], s => s.optional()).validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  await serviceCollectionRef(categoryId).doc(serviceId).set(value, { merge: true });
  const doc = await serviceCollectionRef(categoryId).doc(serviceId).get();
  res.json({ id: doc.id, ...doc.data() });
}

export async function deleteService(req, res) {
  const { categoryId, serviceId } = req.params;
  await serviceCollectionRef(categoryId).doc(serviceId).delete();
  res.json({ ok: true });
}

// Subservices within the array
export async function addSubService(req, res) {
  const { categoryId, serviceId } = req.params;
  const { value, error } = subServiceSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const docRef = serviceCollectionRef(categoryId).doc(serviceId);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Service not found' });
  const subServices = normalizeSubServices(doc.data().subServices);
  // Do not force an id; use name as natural key
  const exists = subServices.some(s => (s.id ? String(s.id) : s.name) === value.name);
  if (exists) return res.status(409).json({ error: 'Subservice with this name already exists' });
  const newItem = { ...value };
  subServices.push(newItem);
  await docRef.set({ subServices }, { merge: true });
  res.status(201).json(newItem);
}

export async function updateSubService(req, res) {
  const { categoryId, serviceId, subId } = req.params;
  const { value, error } = subServiceSchema.fork(['name'], s => s.optional()).validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const docRef = serviceCollectionRef(categoryId).doc(serviceId);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Service not found' });
  const list = normalizeSubServices(doc.data().subServices);
  // Support lookups by explicit id or by name (for legacy data without ids)
  const idx = list.findIndex(s => String(s.id ?? s.name) === String(subId));
  if (idx === -1) return res.status(404).json({ error: 'Subservice not found' });
  list[idx] = { ...list[idx], ...value };
  await docRef.update({ subServices: list });
  res.json(list[idx]);
}

export async function deleteSubService(req, res) {
  const { categoryId, serviceId, subId } = req.params;
  const docRef = serviceCollectionRef(categoryId).doc(serviceId);
  const doc = await docRef.get();
  if (!doc.exists) return res.status(404).json({ error: 'Service not found' });
  const list = normalizeSubServices(doc.data().subServices).filter(s => String(s.id ?? s.name) !== String(subId));
  await docRef.update({ subServices: list });
  res.json({ ok: true });
}

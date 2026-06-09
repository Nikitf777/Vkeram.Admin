import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  fetchProduct,
  fetchProductPriceHistory,
  addProductPrice,
  fetchProductImages,
  uploadProductImage,
  deleteProductImage,
  getImageUrl,
  fetchProductCharacteristics,
  saveProductCharacteristic,
  fetchOrdersByProduct,
  fetchOrderAggregateByProduct,
} from '../api/admin';
import type { AdminProduct, ProductPriceEntry, ProductImage, ProductCharacteristic, SaveProductCharacteristicData } from '../api/admin';
import OrdersView from '../components/OrdersView';

function characteristicLabel(key: string): string {
  const map: Record<string, string> = {
    sizeLengthMm: 'Длина (мм)',
    sizeWidthMm: 'Ширина (мм)',
    sizeHeightMm: 'Высота (мм)',
    weightKg: 'Вес (кг)',
    strengthGrade: 'Марка прочности',
    frostResistance: 'Морозостойкость',
    waterAbsorption: 'Водопоглощение',
    thermalConductivity: 'Теплопроводность (Вт/мК)',
    radiationQuality: 'Радиационное качество',
    quantityPerPallet: 'Количество на поддоне',
    standard: 'Стандарт',
    color: 'Цвет',
    brickType: 'Тип кирпича',
    minimumOrderQuantity: 'Мин. кол-во заказа',
  };
  return map[key] ?? key;
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [prices, setPrices] = useState<ProductPriceEntry[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [characteristics, setCharacteristics] = useState<ProductCharacteristic | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceDialogOpen, setPriceDialogOpen] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductImage | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [charDialogOpen, setCharDialogOpen] = useState(false);
  const [savingChar, setSavingChar] = useState(false);
  const [charForm, setCharForm] = useState<SaveProductCharacteristicData>({});
  const [fromDate, setFromDate] = useState(daysAgo(180));
  const [toDate, setToDate] = useState(today());
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [tabValue, setTabValue] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [productData, priceData, imageData, charData] = await Promise.all([
        fetchProduct(id),
        fetchProductPriceHistory(id, fromDate || undefined, toDate || undefined),
        fetchProductImages(id),
        fetchProductCharacteristics(id).catch(() => null),
      ]);
      setProduct(productData);
      setPrices(priceData);
      setImages(imageData);
      setCharacteristics(charData);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [id, fromDate, toDate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAddPrice = async () => {
    if (!id) return;
    const price = parseFloat(priceInput);
    if (isNaN(price) || price < 0) return;
    try {
      await addProductPrice(id, price);
      setPriceDialogOpen(false);
      setPriceInput('');
      load();
    } catch {
      /* ignore */
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploadFile(file);
  };

  const handleUpload = async () => {
    if (!id || !uploadFile) return;
    setUploading(true);
    try {
      await uploadProductImage(id, uploadFile);
      setUploadDialogOpen(false);
      setUploadFile(null);
      load();
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProductImage(id, deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch {
      /* ignore */
    } finally {
      setDeleting(false);
    }
  };

  const openCharDialog = () => {
    setCharForm({
      sizeLengthMm: characteristics?.sizeLengthMm ?? null,
      sizeWidthMm: characteristics?.sizeWidthMm ?? null,
      sizeHeightMm: characteristics?.sizeHeightMm ?? null,
      weightKg: characteristics?.weightKg ?? null,
      strengthGrade: characteristics?.strengthGrade ?? null,
      frostResistance: characteristics?.frostResistance ?? null,
      waterAbsorption: characteristics?.waterAbsorption ?? null,
      thermalConductivity: characteristics?.thermalConductivity ?? null,
      radiationQuality: characteristics?.radiationQuality ?? null,
      quantityPerPallet: characteristics?.quantityPerPallet ?? null,
      standard: characteristics?.standard ?? null,
      color: characteristics?.color ?? null,
      brickType: characteristics?.brickType ?? null,
      minimumOrderQuantity: characteristics?.minimumOrderQuantity ?? null,
    });
    setCharDialogOpen(true);
  };

  const handleCharSave = async () => {
    if (!id) return;
    setSavingChar(true);
    try {
      await saveProductCharacteristic(id, charForm);
      setCharDialogOpen(false);
      load();
    } catch {
      /* ignore */
    } finally {
      setSavingChar(false);
    }
  };

  const characteristicFields: { key: keyof SaveProductCharacteristicData; type: 'number' | 'text' }[] = [
    { key: 'color', type: 'text' },
    { key: 'brickType', type: 'text' },
    { key: 'sizeLengthMm', type: 'number' },
    { key: 'sizeWidthMm', type: 'number' },
    { key: 'sizeHeightMm', type: 'number' },
    { key: 'weightKg', type: 'number' },
    { key: 'strengthGrade', type: 'text' },
    { key: 'frostResistance', type: 'text' },
    { key: 'waterAbsorption', type: 'text' },
    { key: 'thermalConductivity', type: 'number' },
    { key: 'radiationQuality', type: 'text' },
    { key: 'quantityPerPallet', type: 'number' },
    { key: 'minimumOrderQuantity', type: 'number' },
    { key: 'standard', type: 'text' },
  ];

  if (loading) return <CircularProgress />;
  if (!product) return <Typography>Товар не найден.</Typography>;

  const displayCharFields: { key: keyof ProductCharacteristic; label: string }[] = [
    { key: 'color', label: 'Цвет' },
    { key: 'brickType', label: 'Тип кирпича' },
    { key: 'sizeLengthMm', label: 'Размер' },
    { key: 'weightKg', label: 'Вес (кг)' },
    { key: 'strengthGrade', label: 'Марка прочности' },
    { key: 'frostResistance', label: 'Морозостойкость' },
    { key: 'waterAbsorption', label: 'Водопоглощение' },
    { key: 'thermalConductivity', label: 'Теплопроводность (Вт/мК)' },
    { key: 'radiationQuality', label: 'Радиационное качество' },
    { key: 'quantityPerPallet', label: 'Шт. на поддоне' },
    { key: 'minimumOrderQuantity', label: 'Мин. заказ' },
    { key: 'standard', label: 'Стандарт' },
  ];

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/products')} sx={{ mb: 2 }}>
        Назад к товарам
      </Button>

      <Typography variant="h5" sx={{ mb: 1 }}>{product.name}</Typography>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="О товаре" />
        <Tab label="Заказы" />
      </Tabs>

      {tabValue === 0 && (
        <>

      {images.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
          {images.map((img) => (
            <Box
              key={img.id}
              sx={{
                position: 'relative',
                width: 180,
                height: 180,
                border: 1,
                borderColor: 'grey.300',
                borderRadius: 1,
                overflow: 'hidden',
                '&:hover .delete-btn': { opacity: 1 },
              }}
            >
              <Box
                component="img"
                src={getImageUrl(id!, img.id)}
                alt={img.fileName}
                sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
              <IconButton
                className="delete-btn"
                size="small"
                onClick={() => setDeleteTarget(img)}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  opacity: 0,
                  bgcolor: 'rgba(255,255,255,0.85)',
                  transition: 'opacity 0.15s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.95)' },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      <Button variant="outlined" size="small" startIcon={<CloudUploadIcon />} onClick={() => setUploadDialogOpen(true)} sx={{ mb: 3 }}>
        Загрузить изображение
      </Button>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="caption" color="text.secondary">ID товара</Typography>
          <Typography sx={{ fontFamily: 'monospace', mb: 1 }}>{product.id}</Typography>
          <Typography variant="caption" color="text.secondary">Текущая цена</Typography>
          <Typography variant="h6">
            {product.price != null ? `${product.price.toFixed(2)}` : 'Цена не установлена'}
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Характеристики</Typography>
        <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={openCharDialog}>
          {characteristics ? 'Редактировать' : 'Добавить'}
        </Button>
      </Box>

      {!characteristics ? (
        <Typography color="text.secondary" sx={{ mb: 4 }}>Характеристики не заданы.</Typography>
      ) : (
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ py: 1 }}>
            <Table size="small">
              <TableBody>
                {displayCharFields.map((f) => {
                  const val = characteristics[f.key];
                  if (val == null) return null;
                  const label = f.label || f.key;
                  const isSize = f.key === 'sizeLengthMm';
                  return (
                    <TableRow key={f.key}>
                      <TableCell sx={{ border: 'none', pl: 1, py: 0.5, color: 'text.secondary', width: 180 }}>
                        {label}
                      </TableCell>
                      <TableCell sx={{ border: 'none', py: 0.5 }}>
                        {isSize
                          ? `${characteristics.sizeLengthMm} × ${characteristics.sizeWidthMm} × ${characteristics.sizeHeightMm} mm`
                          : String(val)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">История цен</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="table">
              <TableChartIcon />
            </ToggleButton>
            <ToggleButton value="chart">
              <BarChartIcon />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setPriceDialogOpen(true)}>
            Добавить цену
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          label="Дата от"
          type="date"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <TextField
          label="Дата до"
          type="date"
          size="small"
          slotProps={{ inputLabel: { shrink: true } }}
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <Button
          variant="text"
          size="small"
          onClick={() => { setFromDate(''); setToDate(''); }}
        >
          Сбросить
        </Button>
      </Box>

      {prices.length === 0 ? (
        <Typography color="text.secondary">История цен отсутствует.</Typography>
      ) : viewMode === 'chart' ? (
        <Paper sx={{ p: 2 }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={[...prices].reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="createdAt"
                tickFormatter={(v: string) => new Date(v).toLocaleDateString()}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => v.toFixed(2)}
              />
              <Tooltip
                labelFormatter={(v: any) => new Date(v).toLocaleString(undefined, { hour12: false })}
                formatter={(value: any) => [Number(value).toFixed(2), 'Цена']}
              />
              <Line type="monotone" dataKey="price" stroke="#1976d2" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell align="right">Цена</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {prices.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.createdAt).toLocaleString(undefined, { hour12: false })}</TableCell>
                  <TableCell align="right">{p.price.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      </>)}
      {tabValue === 1 && (
        <OrdersView
          fetchFn={(from, to, isConfirmed, paymentStatus, shipmentStatus, buyerId, userId) => fetchOrdersByProduct(id!, from, to, isConfirmed, paymentStatus, shipmentStatus, buyerId, userId)}
          fetchAggregationFn={(groupBy, days, from, to, isConfirmed, paymentStatus, shipmentStatus, buyerId, userId) => fetchOrderAggregateByProduct(id!, groupBy, days, from, to, isConfirmed, paymentStatus, shipmentStatus, buyerId, userId)}
          showProductQuantity
        />
      )}

      <Dialog open={priceDialogOpen} onClose={() => setPriceDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Добавить цену</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            autoFocus
            label="Цена"
            type="number"
            value={priceInput}
            onChange={(e) => setPriceInput(e.target.value)}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriceDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleAddPrice} disabled={!priceInput || parseFloat(priceInput) < 0}>
            Добавить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={uploadDialogOpen} onClose={() => { if (!uploading) { setUploadDialogOpen(false); setUploadFile(null); } }} maxWidth="sm" fullWidth>
        <DialogTitle>Загрузить изображение</DialogTitle>
        <DialogContent>
          <Box
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            onClick={() => document.getElementById('image-file-input')?.click()}
            sx={{
              border: '2px dashed',
              borderColor: dragOver ? 'primary.main' : 'grey.400',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: dragOver ? 'action.hover' : 'transparent',
              transition: 'all 0.2s',
              mt: 1,
            }}
          >
            <input
              id="image-file-input"
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
            {uploadFile ? (
              <Box>
                <Box
                  component="img"
                  src={URL.createObjectURL(uploadFile)}
                  alt="preview"
                  sx={{ maxWidth: '100%', maxHeight: 200, mb: 1, borderRadius: 1 }}
                />
                <Typography variant="body2">{uploadFile.name}</Typography>
              </Box>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.500', mb: 1 }} />
                <Typography>Перетащите изображение сюда или нажмите для выбора</Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setUploadDialogOpen(false); setUploadFile(null); }} disabled={uploading}>Отмена</Button>
          <Button variant="contained" onClick={handleUpload} disabled={!uploadFile || uploading}>
            {uploading ? 'Загрузка...' : 'Загрузить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => { if (!deleting) setDeleteTarget(null); }} maxWidth="xs" fullWidth>
        <DialogTitle>Удалить изображение</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите удалить это изображение?</Typography>
          {deleteTarget && (
            <Typography variant="caption" color="text.secondary">{deleteTarget.fileName}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Отмена</Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} disabled={deleting}>
            {deleting ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={charDialogOpen} onClose={() => { if (!savingChar) setCharDialogOpen(false); }} maxWidth="sm" fullWidth>
        <DialogTitle>{characteristics ? 'Редактировать' : 'Добавить'} характеристики</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {characteristicFields.map((f) => (
              <TextField
                key={f.key}
                label={characteristicLabel(f.key)}
                type={f.type === 'number' ? 'number' : 'text'}
                value={charForm[f.key] ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setCharForm((prev) => ({
                    ...prev,
                    [f.key]: f.type === 'number' ? (val === '' ? null : Number(val)) : (val === '' ? null : val),
                  }));
                }}
                slotProps={f.type === 'number' ? { htmlInput: { min: 0, step: f.key === 'weightKg' ? 0.1 : 1 } } : undefined}
                fullWidth
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCharDialogOpen(false)} disabled={savingChar}>Отмена</Button>
          <Button variant="contained" onClick={handleCharSave} disabled={savingChar}>
            {savingChar ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

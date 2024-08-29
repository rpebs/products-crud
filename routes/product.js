const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const router = express.Router();

const dataFilePath = path.join(__dirname, "../data/products.json");
const uploadPath = path.join(__dirname, "../");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
  fileFilter: fileFilter,
});

const readData = () => {
  const rawData = fs.readFileSync(dataFilePath);
  return JSON.parse(rawData);
};

const writeData = (data) => {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
};

const generateUniqueId = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random 6-digit number as a string
};

router.post("/", upload.single("image"), (req, res) => {
  const products = readData();
  const newProduct = {
    id: generateUniqueId(),
    nama: req.body.nama,
    kategori: req.body.kategori,
    harga: parseFloat(req.body.harga),
    image: req.file ? `/uploads/${req.file.filename}` : null,
    deskripsi: req.body.deskripsi,
  };

  const fieldsToValidate = {
    nama: "Product name is required",
    kategori: "Product category is required",
    harga: "Product price must be a number",
    deskripsi: "Product description is required",
    image: "Product image is required",
  };
  
  const validationErrors = [];
  
  Object.keys(fieldsToValidate).forEach(field => {
    if (!newProduct[field] || (field === 'harga' && isNaN(newProduct.harga))) {
      validationErrors.push(fieldsToValidate[field]);
    }
  });
  
  if (validationErrors.length > 0) {
    return res.status(400).json({
      message: 'Validation failed!',
      errors: validationErrors,
    });
  }

  products.push(newProduct);
  writeData(products);
  res.status(201).json({
    message: "Product created successfully !",
    data: newProduct,
  });
});

router.get("/", (req, res) => {
    const products = readData();
  
    if (!products || products.length === 0) {
      return res.status(404).json({
        message: "No products found",
      });
    }
  
    // Tambahkan URL lengkap untuk setiap gambar produk
    const updatedProducts = products.map(product => {
      if (product.image) {
        product.image = `${req.protocol}://${req.get('host')}/uploads/${product.image}`;
      }
      return product;
    });
  
    res.json({
      message: "Products retrieved successfully!",
      data: updatedProducts,
    });
  });

// READ a single product
router.get("/:id", (req, res) => {
    const products = readData();
    const product = products.find((p) => p.id === req.params.id);
  
    if (product) {
      // Tambahkan URL lengkap untuk gambar produk jika ada
      if (product.image) {
        product.image = `${req.protocol}://${req.get('host')}/uploads/${product.image}`;
      }
  
      res.json({
        message: "Product retrieved successfully!",
        data: product,
      });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  });
  

// UPDATE a product
router.put("/:id", upload.single("image"), (req, res) => {
  const products = readData();
  const index = products.findIndex((p) => p.id === req.params.id);
  if (index !== -1) {
    const updatedProduct = {
      ...products[index],
      nama: req.body.nama || products[index].nama,
      kategori: req.body.kategori || products[index].kategori,
      harga: !isNaN(parseFloat(req.body.harga))
        ? parseFloat(req.body.harga)
        : products[index].harga,
      image: req.file ? `/uploads/${req.file.filename}` : products[index].image,
      deskripsi: req.body.deskripsi || products[index].deskripsi,
    };

    const fieldsToValidate = {
        nama: "Product name is required",
        kategori: "Product category is required",
        harga: "Product price must be a number",
        deskripsi: "Product description is required",
        image: "Product image is required",
      };
      
      const validationErrors = [];
      
      Object.keys(fieldsToValidate).forEach(field => {
        if (!updatedProduct[field] || (field === 'harga' && isNaN(updatedProduct.harga))) {
          validationErrors.push(fieldsToValidate[field]);
        }
      });
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: 'Validation failed!',
          errors: validationErrors,
        });
      }

    products[index] = updatedProduct;
    writeData(products);
    res.json({
      message: "Product updated successfully !",
      data: updatedProduct,
    });
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

// DELETE a product
router.delete("/:id", (req, res) => {
  let products = readData();
  const productToDelete = products.find((p) => p.id === req.params.id);
  if (productToDelete) {
    if (productToDelete.image) {
      fs.unlinkSync(path.join(uploadPath, productToDelete.image));
    }
    products = products.filter((p) => p.id !== req.params.id);
    writeData(products);
    res.json({ message: "Product deleted successfully !" });
  } else {
    res.status(404).json({ message: "Product not found" });
  }
});

module.exports = router;

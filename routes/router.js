import express from "express"
import bcrypt from "bcrypt"
import { Profile, Session, User } from "../db/schema.js"
import { Like } from "../db/LikeSchema.js"
import { Post } from "../db/Schema-2.js"
import { isAuthenticated } from "../middlewares/auth.js"
import path from 'path';
import fs from "fs"
import {upload,uploadDir} from "../middlewares/uploadMulter.js"

const router = express.Router()

router.post('/api/register',async(req,res)=>{
    const {name,username,email,password} = req.body
    try{
        if(!name || !username || !email || !password){
            return res.status(400).json({message:"Semua field harus diisi"})
        }
        const hash = await bcrypt.hash(password,10)

        const user = await User.create({
            name,
            username,
            email,
            passwordHash:hash
        })
        await Profile.create({
            userId:user.id
        })
        return res.json({message:"Register berhasil",status:200})

    }catch(err){
        return res.status(500).json({message:"Register gagal",status:500,error:err.message})
    }
})

router.post("/api/login",async(req,res)=>{
    const {email,password} = req.body
    try{
       const user = await User.findOne({where:{email}})
       if(!user){
        return res.status(404).json({message:"user tidak ditemukan"})
       }
       const compare = await bcrypt.compare(password,user.passwordHash)
       if(!compare){
        return res.status(400).json({message:"Password Salah"})
       }
       const sessions = await Session.create({
           userId:user.id,
           userAgents: req.headers['user-agent'],
           ipAddress: req.ip,
           expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

       })
       return res.json({message:"Login berhasil",status:200,sessions})  
    }catch(err){
        return res.status(500).json({message:err.message})
    }
})
router.put("/api/profile",async(req,res)=>{
    const {token} = req.headers
    const {gender,birthday,location,website,phone,bio} = req.body
    try{
        const sessions = await Session.findByPk(token,{include:"user"})
        if(!sessions | sessions.revoked){
            return res.status(401).json({message:"Unauthorized"})
        }
        const [profile,created] = await Profile.findOrCreate({
            where:{userId:sessions.user.id},
        })
        await profile.update({
            gender:gender,
            birthday,
            location,
            website,
            phone
        })
        await sessions.user.update({
  bio,
})

        return res.json({message:"Profile berhasil diupdate",status:200,profile})
    }catch(err){
        return res.status(500).json({message:err.message})
    }
})
router.get("/me",isAuthenticated,async(req,res)=>{
    return res.json(req.user)
})
// Gabungan route PUT /api/profile
router.put("/api/profiles", upload.single("avatar"), async (req, res) => {
  const { token } = req.headers;
  const { gender, birthday, location, website, phone, bio } = req.body;

  try {
    const session = await Session.findByPk(token, { include: "user" });

    if (!session || session.revoked) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = session.user;

    // Ambil atau buat profil
    const [profile, created] = await Profile.findOrCreate({
      where: { userId: user.id },
    });

    // Update data profil
    await profile.update({
      gender,
      birthday,
      location,
      website,
      phone,
    });

    // Update bio
    await user.update({ bio });

    // Handle avatar upload
    if (req.file) {
      // Hapus avatar lama jika ada
      if (user.avatarUrl) {
        const oldFile = path.basename(user.avatarUrl);
        const oldPath = path.join(uploadDir, oldFile);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Simpan avatar baru
      const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      await user.update({ avatarUrl });
    }

    return res.json({
      message: "Profile berhasil diupdate",
      status: 200,
      profile,
      avatarUrl: user.avatarUrl || null,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message });
  }
});
// POST /api/posts - buat postingan baru dengan gambar
router.post("/api/posts", isAuthenticated, upload.single("image"), async (req, res) => {
  const { title, content } = req.body;
  const user = req.user;

  if (!title || !content) {
    return res.status(400).json({ message: "Title dan content wajib diisi" });
  }

  try {
    let imageUrl = null;

    if (req.file) {
      // Buat URL akses file, misalnya http://localhost:3000/uploads/namafile.jpg
      imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    const newPost = await Post.create({
      userId: user.id,
      title,
      content,
      imageUrl,
    });

    res.status(201).json({ message: "Post berhasil dibuat", post: newPost });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/api/posts", isAuthenticated, async (req, res) => {
  const user = req.user;

  try {
    const posts = await Post.findAll({
      include: {
        model: User,
        as: "author",
        attributes: ["id", "name", "username", "avatarUrl"],
      },
      order: [["createdAt", "DESC"]],
    });

    // Ambil semua postId yang sudah di-like oleh user
    const likedPostIds = await Like.findAll({
      where: { userId: user.id },
      attributes: ["postId"],
    }).then(likes => likes.map(like => like.postId));

    // Tambahkan statusLiked ke setiap post
    const enrichedPosts = posts.map(post => {
      const isLiked = likedPostIds.includes(post.id);
      return {
        ...post.toJSON(),
        statusLiked: isLiked,
      };
    });

    res.json({ posts: enrichedPosts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/api/users/posts", isAuthenticated, async (req, res) => {
  const user = req.user;

  try {
    // Ambil semua postingan milik user yang sedang login
    const posts = await Post.findAll({
      where: { userId: user.id },
      include: {
        model: User,
        as: "author",
        attributes: ["id", "name", "username", "avatarUrl"],
      },
      order: [["createdAt", "DESC"]],
    });

    // Cari apakah user like post miliknya sendiri
    const likedPostIds = await Like.findAll({
      where: { userId: user.id },
      attributes: ["postId"],
    }).then(likes => likes.map(like => like.postId));

    const enrichedPosts = posts.map(post => ({
      ...post.toJSON(),
      statusLiked: likedPostIds.includes(post.id),
    }));

    res.json({ posts: enrichedPosts });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.post("/api/posts/:id/like", isAuthenticated, async (req, res) => {
  const user = req.user;
  const postId = req.params.id;

  try {
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: "Post tidak ditemukan" });

    const existingLike = await Like.findOne({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });

    if (existingLike) {
      return res.status(400).json({ message: "Kamu sudah like postingan ini",statusLiked:existingLike?true:false });
    }

    await Like.create({ userId: user.id, postId: post.id });

    post.likes += 1;
    await post.save();

    res.json({ message: "Like berhasil ditambahkan", likes: post.likes,statusLiked:existingLike?true:false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete("/api/posts/:id/like", isAuthenticated, async (req, res) => {
  const user = req.user;
  const postId = req.params.id;

  try {
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: "Post tidak ditemukan" });

    const like = await Like.findOne({
      where: {
        userId: user.id,
        postId: post.id,
      },
    });

    if (!like) {
      return res.status(400).json({ message: "Kamu belum like postingan ini" });
    }

    await like.destroy(); // hapus dari tabel likes

    // Kurangi jumlah likes (jangan minus)
    post.likes = Math.max(0, post.likes - 1);
    await post.save();

    res.json({ message: "Unlike berhasil", likes: post.likes });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/api/users/likes", isAuthenticated, async (req, res) => {
  const user = req.user;

  try {
    const userWithLikes = await User.findByPk(user.id, {
      include: {
        model: Post,
        as: "likedPosts",
        include: {
          model: User,
          as: "author",
          attributes: ["id", "name", "username", "avatarUrl"],
        },
      },
    });

    res.json({
      userId: user.id,
      likedPosts: userWithLikes.likedPosts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.delete("/api/posts/:id", isAuthenticated, async (req, res) => {
  const user = req.user;
  const postId = req.params.id;

  try {
    const post = await Post.findByPk(postId);

    if (!post) {
      return res.status(404).json({ message: "Postingan tidak ditemukan" });
    }

    // Cek apakah post milik user yang login
    if (post.userId !== user.id) {
      return res.status(403).json({ message: "Kamu tidak memiliki akses untuk menghapus postingan ini" });
    }

    await post.destroy();

    res.json({ message: "Postingan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put("/api/posts/:id", isAuthenticated, upload.single("image"), async (req, res) => {
  const user = req.user;
  const postId = req.params.id;
  const { title, content } = req.body;

  try {
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: "Postingan tidak ditemukan" });

    if (post.userId !== user.id) {
      return res.status(403).json({ message: "Kamu tidak punya izin mengedit postingan ini" });
    }

    let newImageUrl = post.imageUrl;

    // Jika upload gambar baru
    if (req.file) {
      // Hapus gambar lama jika ada
      if (post.imageUrl) {
        const oldFilename = path.basename(post.imageUrl);
        const oldPath = path.join(uploadDir, oldFilename);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // Simpan URL gambar baru
      newImageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    }

    await post.update({
      title: title || post.title,
      content: content || post.content,
      imageUrl: newImageUrl,
    });

    res.json({ message: "Postingan berhasil diperbarui", post });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
export default router
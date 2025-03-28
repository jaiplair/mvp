// Import required modules
const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.json());

// Serve static files from React build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// ========================================================
// Authentication Routes using Supabase Auth
// ========================================================

// Registration endpoint using Supabase Auth
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    console.log(`Received registration request for email: ${email}`);

    // Email validation
    const emailPattern = /@(spelman\.edu|morehouse\.edu)$/;
    if (!emailPattern.test(email)) {
        return res.status(400).json({ success: false, message: 'Email must end with @spelman.edu or @morehouse.edu.' });
    }

    try {
        // Register user in Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } } // Store additional user info
        });

        if (error) throw error;

        res.json({ success: true, message: 'Registration successful. Check your email for verification.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error registering user' });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`Received login request for email: ${email}`);

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        res.json({ success: true, message: 'Login successful', user: data.user });
    } catch (error) {
        console.error('Login error:', error);
        res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
});

// Email verification using 6-digit code
app.post('/verify', async (req, res) => {
    const { email, verificationCode } = req.body;
    console.log(`Verifying email: ${email} with code: ${verificationCode}`);

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: verificationCode,
            type: 'signup'
        });

        if (error) {
            console.error('Verification failed:', error);
            return res.status(400).json({ success: false, message: 'Invalid verification code.' });
        }

        res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, message: 'Error verifying email' });
    }
});

// Create a new community
app.post('/api/communities', async (req, res) => {
    const { name, description } = req.body;
    
    const { authorization } = req.headers;
    if (!authorization) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        const { data, error } = await supabase
            .from('communities')
            .insert({
                name,
                description,
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ error: 'Failed to create community' });
    }
});

// Get all communities with post counts
app.get('/api/communities', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('communities')
            .select(`
                *,
                posts_count:posts(count)
            `);

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
});

// Create a new post
app.post('/api/posts', upload.single('image'), async (req, res) => {
    const { communityId, text } = req.body;
    
    console.log('Post Creation Request:', {
        communityId,
        text,
        hasFile: !!req.file
    });

    try {
        // Ensure bucket exists before any upload attempt
        await createCommunityPostsBucket();

        const { authorization } = req.headers;
        if (!authorization) return res.status(401).json({ error: 'Unauthorized' });

        const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.replace('Bearer ', ''));
        if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

        let imageUrl = null;

        // Handle image upload to Supabase storage
        if (req.file) {
            const fileExt = path.extname(req.file.originalname);
            const fileName = `${uuidv4()}${fileExt}`;

            console.log('Uploading file:', fileName);

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('community-posts')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: true
                });

            if (uploadError) {
                console.error('Upload Error:', uploadError);
                return res.status(500).json({ error: 'Failed to upload image', details: uploadError });
            }

            // Generate public URL
            const { data: { publicUrl } } = supabase.storage
                .from('community-posts')
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
            console.log('Image URL:', imageUrl);
        }

        // Insert post into database
        const { data, error } = await supabase
            .from('posts')
            .insert({
                community_id: communityId,
                text,
                user_id: user.id,
                image_url: imageUrl
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ error: 'Failed to create post', details: error.message });
    }
});

// Updated route to fetch posts
app.get('/api/posts/:communityId', async (req, res) => {
    const { communityId } = req.params;

    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
                *,
                users (name)
            `)
            .eq('community_id', communityId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching community posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// GET single community details
app.get('/api/communities/:communityId', async (req, res) => {
    const { communityId } = req.params;

    try {
        const { data, error } = await supabase
            .from('communities')
            .select('*')
            .eq('id', communityId)
            .single();

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching community details:', error);
        res.status(404).json({ error: 'Community not found' });
    }
});

// Fallback route to serve React frontend for any unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Create Community Posts Bucket if it doesn't exist
const createCommunityPostsBucket = async () => {
    try {
        // First, try to get the bucket
        const { data, error: getBucketError } = await supabase.storage.getBucket('community-posts');

        // If bucket doesn't exist, create it
        if (getBucketError) {
            console.log('Bucket does not exist. Creating now...');

            const { data: createData, error: createError } = await supabase.storage.createBucket('community-posts', {
                public: true,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                maxUploadFileSize: 5 * 1024 * 1024 // 5MB limit
            });

            if (createError) {
                console.error('Failed to create bucket:', createError);
                throw createError;
            }

            console.log('Community posts bucket created successfully');
        } else {
            console.log('Community posts bucket already exists');
        }
    } catch (err) {
        console.error('Unexpected error creating bucket:', err);
        throw err;
    }
};

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;

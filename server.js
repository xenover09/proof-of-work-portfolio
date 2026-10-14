const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db.js');
const matcher = require('./matcher.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// HTML Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/create', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'create.html'));
});

app.get('/cv', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cv.html'));
});

app.get('/cv-builder', (req, res) => {
  res.redirect('/cv');
});

app.get('/p/:username', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portfolio.html'));
});

app.get('/project/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'project.html'));
});

app.get('/confirm/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'confirm.html'));
});

// API Routes

// Job-Criteria CV Audit
app.post('/api/cv-audit', (req, res) => {
  try {
    const { cvData, jobDescription } = req.body;
    if (!cvData || !jobDescription) {
      return res.status(400).json({ success: false, error: 'Both cvData and jobDescription are required.' });
    }
    const audit = matcher.auditCvAgainstJob(cvData, jobDescription);
    res.json({ success: true, audit });
  } catch (err) {
    console.error('CV Audit Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Platform stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List public projects
app.get('/api/projects', (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const projects = db.getAllProjects(limit);
    res.json({ success: true, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create project & profile
app.post('/api/projects', (req, res) => {
  try {
    const { profile, project, decisions, artefacts } = req.body;

    if (!profile || !profile.username || !profile.full_name) {
      return res.status(400).json({ success: false, error: 'Profile username and full name are required.' });
    }

    if (!project || !project.title || !project.problem || !project.result) {
      return res.status(400).json({ success: false, error: 'Project title, problem statement, and result are required.' });
    }

    const savedProfile = db.createOrUpdateProfile(profile);

    const createdProject = db.createProject({
      profile_id: savedProfile.id,
      title: project.title,
      summary: project.summary || '',
      problem: project.problem,
      result: project.result,
      defensible_number: project.defensible_number || '',
      my_role_attribution: project.my_role_attribution || '',
      ai_disclosure: project.ai_disclosure || '',
      is_nda: project.is_nda ? 1 : 0,
      live_url: project.live_url || '',
      repo_url: project.repo_url || '',
      readme_url: project.readme_url || '',
      client_name: project.client_name || '',
      client_email: project.client_email || '',
      request_confirmation: !!project.request_confirmation,
      is_sample: project.is_sample ? 1 : 0,
      decisions: Array.isArray(decisions) ? decisions : [],
      artefacts: Array.isArray(artefacts) ? artefacts : []
    });

    const host = req.get('host');
    const protocol = req.protocol;
    const confirmUrl = createdProject.client_confirm_token 
      ? `${protocol}://${host}/confirm/${createdProject.client_confirm_token}` 
      : null;

    res.status(201).json({
      success: true,
      profile: savedProfile,
      project: createdProject,
      confirmUrl,
      portfolioUrl: `/p/${savedProfile.username}`,
      projectUrl: `/project/${createdProject.id}`
    });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single project
app.get('/api/projects/:id', (req, res) => {
  try {
    const project = db.getProjectById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const confirmUrl = project.client_confirm_token 
      ? `${protocol}://${host}/confirm/${project.client_confirm_token}` 
      : null;

    res.json({ success: true, project, confirmUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get portfolio by username
app.get('/api/portfolio/:username', (req, res) => {
  try {
    const profile = db.getProfileByUsername(req.params.username);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Portfolio profile not found' });
    }

    const projects = db.getProjectsByProfileId(profile.id);
    res.json({ success: true, profile, projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Request confirmation link for a project
app.post('/api/projects/:id/request-confirm', (req, res) => {
  try {
    const { client_name, client_email } = req.body;
    const result = db.requestConfirmation(req.params.id, client_name, client_email);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fullConfirmUrl = `${protocol}://${host}/confirm/${result.token}`;

    res.json({
      success: true,
      token: result.token,
      confirmUrl: fullConfirmUrl
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Client confirmation endpoint: GET verification details
app.get('/api/confirm/:token', (req, res) => {
  try {
    const project = db.getProjectByConfirmToken(req.params.token);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Invalid or expired confirmation link.' });
    }

    res.json({
      success: true,
      project: {
        id: project.id,
        title: project.title,
        summary: project.summary,
        problem: project.problem,
        result: project.result,
        defensible_number: project.defensible_number,
        my_role_attribution: project.my_role_attribution,
        ai_disclosure: project.ai_disclosure,
        is_nda: project.is_nda,
        live_url: project.live_url,
        repo_url: project.repo_url,
        readme_url: project.readme_url,
        author_name: project.author_name,
        author_role: project.author_role,
        username: project.username,
        client_name: project.client_name,
        client_confirm_status: project.client_confirm_status,
        client_confirmed_at: project.client_confirmed_at,
        client_feedback: project.client_feedback,
        artefacts: project.artefacts,
        decisions: project.decisions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Client confirmation endpoint: POST client decision
app.post('/api/confirm/:token', (req, res) => {
  try {
    const { decision, client_name, client_feedback } = req.body;

    if (!decision || !['confirmed', 'disputed'].includes(decision)) {
      return res.status(400).json({ success: false, error: "Decision must be 'confirmed' or 'disputed'." });
    }

    const result = db.updateConfirmStatus(req.params.token, decision, client_name, client_feedback);
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      status: result.status,
      message: result.status === 'confirmed' ? 'Proof of work confirmed successfully!' : 'Claim marked as disputed.',
      portfolioUrl: `/p/${result.username}`,
      projectUrl: `/project/${result.projectId}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Proof-of-Work Portfolio server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;

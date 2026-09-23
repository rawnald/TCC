import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, trigger = 'MANUAL', actor = 'system' } = body;

    const token = process.env.GITHUB_ACCESS_TOKEN;
    const owner = process.env.GITHUB_REPO_OWNER;
    const repo = process.env.GITHUB_REPO_NAME;
    const path = process.env.GITHUB_SNAPSHOT_PATH || 'data/records-snapshot.json';
    const branch = process.env.GITHUB_BRANCH || 'main';

    const timestamp = new Date().toISOString();
    const snapshotPayload = {
      snapshot_meta: {
        timestamp,
        trigger,
        actor,
        total_records: Array.isArray(data) ? data.length : 0,
        version: '1.0.0',
      },
      records: data || [],
    };

    const jsonString = JSON.stringify(snapshotPayload, null, 2);
    const base64Content = Buffer.from(jsonString).toString('base64');

    // Check if GitHub token and repo details are configured
    if (!token || !owner || !repo || token === 'ghp_yourPersonalAccessTokenHere') {
      return NextResponse.json({
        success: true,
        mode: 'simulated',
        message: 'GitHub credentials not configured. Snapshot logged in local memory/simulation mode.',
        snapshot_meta: snapshotPayload.snapshot_meta,
      });
    }

    // 1. Get existing file SHA if it exists
    let existingSha: string | undefined;
    const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

    const getRes = await fetch(getUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Tactical-Command-Dashboard-Bot',
      },
    });

    if (getRes.ok) {
      const fileData = await getRes.json();
      existingSha = fileData.sha;
    }

    // 2. Commit update to the primary snapshot path
    const commitUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const commitBody: Record<string, any> = {
      message: `Operational Snapshot: [${trigger}] by ${actor} at ${timestamp}`,
      content: base64Content,
      branch: branch,
    };

    if (existingSha) {
      commitBody.sha = existingSha;
    }

    const putRes = await fetch(commitUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Tactical-Command-Dashboard-Bot',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commitBody),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      return NextResponse.json(
        {
          success: false,
          error: `GitHub API error: ${errText}`,
        },
        { status: putRes.status }
      );
    }

    const putData = await putRes.json();

    return NextResponse.json({
      success: true,
      mode: 'live_github',
      commit_sha: putData.commit?.sha,
      html_url: putData.commit?.html_url,
      path: path,
      timestamp: timestamp,
      message: `Successfully committed automated snapshot to GitHub repository: ${owner}/${repo}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal error processing GitHub snapshot',
      },
      { status: 500 }
    );
  }
}

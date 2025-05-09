
import { NextResponse, type NextRequest } from 'next/server';
import type { Client, CreateClientPayload } from '@/types';
import { serverClients, addClientToServer, refreshClientAIInsights } from '@/lib/api-utils';

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: serverClients });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: `Failed to fetch clients: ${errorMessage}` }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json() as CreateClientPayload;
    if (!payload.name || !payload.email || !payload.phone) {
      return NextResponse.json({ success: false, error: 'Missing required client fields' }, { status: 400 });
    }

    let newClient = addClientToServer(payload);
    
    // Initial AI insights generation
    try {
      const aiData = await refreshClientAIInsights(newClient);
      newClient = { ...newClient, ...aiData };
      // Update client in serverClients array with AI data
      const clientIndex = serverClients.findIndex(c => c.id === newClient.id);
      if (clientIndex !== -1) {
        serverClients[clientIndex] = newClient;
      }
    } catch (aiError) {
      console.warn(`AI insights for new client ${newClient.id} failed but client created: ${aiError instanceof Error ? aiError.message : String(aiError)}`);
      // Client is still created, AI data can be refreshed later
    }

    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error in POST /api/clients:", error);
    return NextResponse.json({ success: false, error: `Failed to create client: ${errorMessage}` }, { status: 500 });
  }
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { applyClassificationQuery } from '../src/photo-classification-query.js';
test('server query scopes category and descendants before limit, retaining workspace and RLS token',async()=>{
  let request;
  const client=createClient('https://example.supabase.co','public-test-key',{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(url,init)=>{request={url:new URL(url),headers:new Headers(init.headers)};return new Response('[]',{status:200,headers:{'Content-Type':'application/json','Content-Range':'0-0/0'}})}}});
  const query=client.from('evidences').select('id',{count:'exact'}).eq('workspace_id','workspace-A');
  const {error}=await applyClassificationQuery(query,{group:'trade',category:'trade.extra',stage:'after'}).limit(500);
  assert.equal(error,null);assert.equal(request.url.searchParams.get('workspace_id'),'eq.workspace-A');
  assert.equal(request.url.searchParams.get('metadata->classification->>group'),'eq.trade');
  assert.equal(request.url.searchParams.get('metadata->classification->>stage'),'eq.after');
  assert.match(request.url.searchParams.get('or'),/parentId.eq.trade.extra/);
  assert.equal(request.url.searchParams.get('limit'),'500');assert.equal(request.headers.get('authorization'),'Bearer public-test-key');
});
test('filter syntax cannot be injected through category, group or stage',()=>{
  const q={eq(){return this},or(){return this}};
  for(const filters of [{group:'all',category:'trade.extra),id.neq.0',stage:'all'},{group:'other',category:'all',stage:'all'},{group:'all',category:'all',stage:'other'}])assert.throws(()=>applyClassificationQuery(q,filters));
});

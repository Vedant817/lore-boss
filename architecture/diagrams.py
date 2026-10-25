# Generates SVG architecture diagrams (source of truth = this file; mirrors the tldraw canvas tkrg20lk)
import html
C={'violet':'#9146FF','blue':'#3B82F6','green':'#2EE6A6','orange':'#FF9F43','red':'#FF4F6D','yellow':'#FFC83D','grey':'#6B6B7B','lv':'#B57BFF'}
def svg(name,title,boxes,arrows,w=1600,h=520):
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" font-family="Inter,Arial" font-size="14">',f'<rect width="100%" height="100%" fill="#0E0B16"/>','<defs><marker id="m" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#EFEFF1"/></marker></defs>',f'<text x="24" y="40" fill="#EFEFF1" font-size="24" font-weight="700">{html.escape(title)}</text>']
    pos={}
    for id,x,y,bw,bh,t,c in boxes:
        pos[id]=(x,y,bw,bh)
        out.append(f'<rect x="{x}" y="{y}" width="{bw}" height="{bh}" rx="12" fill="#18122B" stroke="{C[c]}" stroke-width="2"/>')
        for i,l in enumerate(t.split('\n')):
            out.append(f'<text x="{x+bw/2}" y="{y+bh/2-8*(len(t.split(chr(10)))-1)+i*18+5}" fill="#EFEFF1" text-anchor="middle">{html.escape(l)}</text>')
    for a,b,lab in arrows:
        ax,ay,aw,ah=pos[a];bx,by,bw,bh=pos[b]
        x1,y1=ax+aw/2,ay+ah/2;x2,y2=bx+bw/2,by+bh/2
        if abs(x2-x1)>abs(y2-y1): x1+= aw/2*(1 if x2>x1 else -1); x2-= bw/2*(1 if x2>x1 else -1)
        else: y1+= ah/2*(1 if y2>y1 else -1); y2-= bh/2*(1 if y2>y1 else -1)
        out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#EFEFF1" stroke-width="1.5" marker-end="url(#m)"/>')
        if lab: out.append(f'<text x="{(x1+x2)/2+4}" y="{(y1+y2)/2-6}" fill="#ADADB8" font-size="12">{html.escape(lab)}</text>')
    out.append('</svg>');open(name+'.svg','w').write('\n'.join(out))
def chain(name,title,items,color='violet',extra_b=[],extra_a=[],h=320):
    b=[(f'n{i}',24+i*312,90,280,110,t,color) for i,t in enumerate(items)]+extra_b
    a=[(f'n{i}',f'n{i+1}','') for i in range(len(items)-1)]+extra_a
    svg(name,title,b,a,h=h)
svg('01-system-context','1. System context',[('s',24,120,300,90,'Streamer + Mods\n(setup page, mod queue)','blue'),('lb',560,120,340,110,'LORE BOSS\nlocal Node/TS server','violet'),('tw',1150,60,400,90,'Twitch\nEventSub WebSocket + Helix Chat API','lv'),('llm',1150,220,400,90,'LLM provider\n(lore extraction, flavor text)','orange'),('obs',560,340,340,90,'OBS browser source overlay\n-> stream -> viewers','green')],[('s','lb','approve / settings'),('tw','lb','chat, cheer, raid'),('lb','llm','schema prompts'),('lb','obs','overlay WS')],h=470)
svg('02-components','2. Components / modules',[('tw',24,80,300,80,'twitch/\nOAuth, EventSub WS, chat send','lv'),('src',380,80,320,80,'events/sources\nLiveTwitchSource | ReplaySource(flag)','violet'),('bus',760,80,260,80,'events/EventBus\n(typed LBEvent)','red'),('lore',560,240,300,80,'lore/\nbuffer -> extractor -> queue','violet'),('boss',960,240,300,80,'boss/\ndeterministic state machine','violet'),('llm',160,240,300,80,'llm/\nclient, JSON schemas, timeouts','orange'),('db',560,400,300,80,'db/ SQLite','yellow'),('ws',960,400,300,80,'overlay/ WS server -> OBS page','green'),('web',160,400,300,80,'web/ setup + mod queue','blue')],[('tw','src',''),('src','bus',''),('bus','lore',''),('bus','boss',''),('lore','llm',''),('lore','db',''),('boss','db',''),('boss','ws','StateDelta'),('web','db','')],h=520)
chain('03-event-flow','3. Event flow',['Twitch EventSub\nchat.message / cheer / raid','normalize\n-> LBEvent','EventBus.publish','lore.ingest\nboss.apply(cmd)','StateDelta -> overlay WS\n-> OBS'])
chain('04-lore-approval','4. Lore approval sequence',['chat -> rolling buffer\n(60s window)','LLM extract -> JSON\n(schema-validated, 5s timeout)','lore_items status=pending\n(+ evidence msg ids)','Mod: Approve/Edit/Reject\n(web UI)','approved -> ticker\n+ boss attack pool'])
chain('05-raid-recap','5. Raid recap sequence',['channel.raid\n(to_broadcaster_user_id)','select top approved lore','LLM recap text\n(or labeled template)','overlay: Previously On...\n(~20s)','raiders join via !attack'],'green')
chain('06-data-model','6. Data model (SQLite)',['sessions\nid, source, started_at','chat_messages\nid, session_id, user_id, text','lore_items\nid, kind, text, status, evidence','bosses\nid, name, max_hp, lore_ids','damage_events\nboss_id, user_id, amount, crit'],'yellow')
chain('07-orchestration-loop','7. Agent orchestration loop (Codex = main thread)',['Codex orchestrator\nplan -> task card','opencode implementer\n(DeepSeek / GLM)','gates: tests, typecheck,\nlint, guardrail grep','reviewer subagent (other model)\n+ Codex final review','merge, commit\n"codex: <milestone>"'],extra_b=[('f',640,240,340,70,'FAIL -> fix card (max 3) -> escalate to human','orange'),('mo',24,240,340,70,'free-tier limit -> Modal-hosted same model','grey')],extra_a=[('n3','f',''),('f','n1',''),('n1','mo','')],h=340)

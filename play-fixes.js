window.rewardModal=function(c){
  const allowCopy=payload?.campaign?.redemption_controls?.allowCouponCopy!==false;
  const d=document.createElement('div');
  d.className='reward-modal';
  d.innerHTML=`<div class="reward-box"><div class="emoji">🎉</div><span class="reward-type">${c.reward_type==='comeback'?'Come-BCK reward':'Instant reward'}</span><h2>Congratulations!</h2><p>You won: <strong>${esc(c.reward_label)}</strong></p><div class="coupon-code">${esc(c.code)}</div><p>${c.reward_type==='comeback'?'Save this code for your next visit.':'Show this code at the counter to redeem.'}</p>${allowCopy?'<button class="primary-btn full" data-copy>Copy code</button>':''}<button class="secondary-btn full" style="margin-top:10px" data-done>Done</button></div>`;
  document.body.append(d);
  const copy=d.querySelector('[data-copy]');
  if(copy)copy.onclick=async()=>{try{await navigator.clipboard.writeText(c.code);copy.textContent='Copied ✓'}catch{copy.textContent=c.code}};
  d.querySelector('[data-done]').onclick=()=>{d.remove();showGamePicker(true)};
};

window.issue=async function(reward,game){
  if(!reward||reward.type==='none'||!reward.label)return lose('Better luck next time!','Come back soon for another chance to win.');
  const result=await client.rpc('issue_public_coupon',{
    p_merchant_id:merchantId,
    p_campaign_id:payload.campaign.id,
    p_visitor_id:visitor,
    p_game:game,
    p_reward_label:reward.label,
    p_reward_type:reward.type||'instant',
    p_base_code:reward.code||'BCK',
    p_expires_hours:reward.type==='comeback'?168:24
  });
  if(result.error||!result.data?.ok){
    console.error(result.error||result.data);
    return window.error('Reward error','Your game completed, but we could not issue the coupon. Please show this screen to staff.');
  }
  rewardModal(result.data.coupon);
};

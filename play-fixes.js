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

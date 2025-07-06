import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/Profile.css';

const VipRegister = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { user } = useAuth();

  const vipPlans = [
    {
      id: 'monthly',
      name: 'Gói Tháng',
      price: '99.000đ',
      duration: '1 tháng',
      features: [
        'Xem phim không giới hạn',
        'Chất lượng HD',
        'Không quảng cáo',
        'Tải xuống để xem offline',
      ]
    },
    {
      id: 'quarterly',
      name: 'Gói Quý',
      price: '249.000đ',
      duration: '3 tháng',
      features: [
        'Tất cả tính năng của Gói Tháng',
        'Tiết kiệm 16%',
        'Ưu tiên hỗ trợ khách hàng',
        'Xem trước nội dung mới'
      ]
    },
    {
      id: 'yearly',
      name: 'Gói Năm',
      price: '899.000đ',
      duration: '12 tháng',
      features: [
        'Tất cả tính năng của Gói Quý',
        'Tiết kiệm 25%',
        'Tặng 2 tháng miễn phí',
        'Ưu đãi đặc biệt cho người thân'
      ]
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    try {
      // TODO: Implement payment integration
      console.log('Processing subscription for plan:', selectedPlan);
    } catch (error) {
      console.error('Error processing subscription:', error);
    }
  };

  return (
    <div className="vip-register-container">
      <h2>Nâng cấp tài khoản VIP</h2>
      <p className="vip-description">
        Trải nghiệm Movigo với chất lượng tốt nhất và nhiều tính năng độc quyền
      </p>

      <div className="vip-plans">
        {vipPlans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            <h3>{plan.name}</h3>
            <div className="plan-price">{plan.price}</div>
            <div className="plan-duration">{plan.duration}</div>
            <ul className="plan-features">
              {plan.features.map((feature, index) => (
                <li key={index}>{feature}</li>
              ))}
            </ul>
            <button
              className={`select-plan-btn ${selectedPlan === plan.id ? 'selected' : ''}`}
            >
              {selectedPlan === plan.id ? 'Đã chọn' : 'Chọn gói này'}
            </button>
          </div>
        ))}
      </div>

      <div className="subscription-action">
        <button
          className="subscribe-btn"
          disabled={!selectedPlan}
          onClick={handleSubscribe}
        >
          Đăng ký ngay
        </button>
        <p className="subscription-note">
          * Bạn có thể hủy đăng ký bất cứ lúc nào
        </p>
      </div>
    </div>
  );
};

export default VipRegister;
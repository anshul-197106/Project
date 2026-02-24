"""Management command to seed the database with sample data."""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Profile
from gigs.models import Category, Gig
from orders.models import Order
from reviews.models import Review

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with sample data for demo/college project'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding database...')

        # Create categories
        categories_data = [
            {'name': 'Web Development', 'slug': 'web-development', 'icon': '💻', 'description': 'Website and web app development'},
            {'name': 'Mobile Development', 'slug': 'mobile-development', 'icon': '📱', 'description': 'iOS and Android app development'},
            {'name': 'Graphic Design', 'slug': 'graphic-design', 'icon': '🎨', 'description': 'Logos, banners, and visual content'},
            {'name': 'Content Writing', 'slug': 'content-writing', 'icon': '✍️', 'description': 'Blog posts, articles, and copywriting'},
            {'name': 'Video Editing', 'slug': 'video-editing', 'icon': '🎬', 'description': 'Video production and post-processing'},
            {'name': 'Digital Marketing', 'slug': 'digital-marketing', 'icon': '📈', 'description': 'SEO, SEM, and social media marketing'},
            {'name': 'Data Science', 'slug': 'data-science', 'icon': '📊', 'description': 'Data analysis, ML, and visualization'},
            {'name': 'UI/UX Design', 'slug': 'ui-ux-design', 'icon': '🖌️', 'description': 'User interface and experience design'},
        ]
        categories = {}
        for cat_data in categories_data:
            cat, _ = Category.objects.get_or_create(slug=cat_data['slug'], defaults=cat_data)
            categories[cat.slug] = cat
            self.stdout.write(f'  ✅ Category: {cat.name}')

        # Create users
        users_data = [
            {
                'username': 'rahul_dev', 'email': 'rahul@example.com', 'password': 'password123',
                'is_freelancer': True,
                'profile': {
                    'full_name': 'Rahul Sharma', 'bio': 'Full-stack developer with 3+ years of experience in React, Node.js, and Django. Passionate about building scalable web applications.',
                    'skills': 'React,Django,Python,JavaScript,Node.js,PostgreSQL',
                    'hourly_rate': 25, 'location': 'Mumbai, India', 'tagline': 'Building the web, one component at a time',
                    'languages': 'English,Hindi', 'education': 'B.Tech Computer Science, IIT Mumbai',
                    'experience_years': 3, 'total_earnings': 15000, 'total_orders_completed': 45, 'average_rating': 4.8,
                },
            },
            {
                'username': 'priya_design', 'email': 'priya@example.com', 'password': 'password123',
                'is_freelancer': True,
                'profile': {
                    'full_name': 'Priya Patel', 'bio': 'Creative graphic designer specializing in brand identity, UI/UX, and motion graphics. Let me bring your vision to life!',
                    'skills': 'Photoshop,Illustrator,Figma,After Effects,UI/UX',
                    'hourly_rate': 30, 'location': 'Bangalore, India', 'tagline': 'Design that speaks louder than words',
                    'languages': 'English,Hindi,Kannada', 'education': 'B.Des, NID Ahmedabad',
                    'experience_years': 4, 'total_earnings': 22000, 'total_orders_completed': 68, 'average_rating': 4.9,
                },
            },
            {
                'username': 'amit_writer', 'email': 'amit@example.com', 'password': 'password123',
                'is_freelancer': True,
                'profile': {
                    'full_name': 'Amit Kumar', 'bio': 'Professional content writer and SEO specialist. I create engaging content that ranks and converts.',
                    'skills': 'Content Writing,SEO,Copywriting,Blog Writing,Technical Writing',
                    'hourly_rate': 15, 'location': 'Delhi, India', 'tagline': 'Words that work, content that converts',
                    'languages': 'English,Hindi', 'education': 'MA English Literature, DU',
                    'experience_years': 2, 'total_earnings': 8000, 'total_orders_completed': 32, 'average_rating': 4.6,
                },
            },
            {
                'username': 'neha_mobile', 'email': 'neha@example.com', 'password': 'password123',
                'is_freelancer': True,
                'profile': {
                    'full_name': 'Neha Gupta', 'bio': 'Mobile app developer with expertise in React Native and Flutter. Building apps that users love.',
                    'skills': 'React Native,Flutter,Dart,Swift,Kotlin,Firebase',
                    'hourly_rate': 35, 'location': 'Pune, India', 'tagline': 'Apps that make a difference',
                    'languages': 'English,Hindi,Marathi', 'education': 'B.Tech IT, COEP Pune',
                    'experience_years': 3, 'total_earnings': 18000, 'total_orders_completed': 38, 'average_rating': 4.7,
                },
            },
            {
                'username': 'buyer_john', 'email': 'john@example.com', 'password': 'password123',
                'is_freelancer': False,
                'profile': {
                    'full_name': 'John Buyer', 'bio': 'Looking for talented freelancers for my startup projects.',
                    'skills': '', 'hourly_rate': 0, 'location': 'Hyderabad, India',
                    'tagline': 'Startup founder', 'languages': 'English',
                    'education': 'MBA, ISB Hyderabad', 'experience_years': 0,
                },
            },
        ]

        created_users = {}
        for user_data in users_data:
            profile_data = user_data.pop('profile')
            if not User.objects.filter(email=user_data['email']).exists():
                user = User.objects.create_user(
                    username=user_data['username'],
                    email=user_data['email'],
                    password=user_data['password'],
                    is_freelancer=user_data['is_freelancer'],
                    is_buyer=True,
                )
                Profile.objects.update_or_create(user=user, defaults=profile_data)
                created_users[user.username] = user
                self.stdout.write(f'  ✅ User: {user.username}')
            else:
                user = User.objects.get(email=user_data['email'])
                created_users[user.username] = user

        # Create gigs
        gigs_data = [
            {
                'seller': 'rahul_dev', 'category': 'web-development',
                'title': 'I will build a responsive React website',
                'description': 'I will create a modern, responsive website using React.js with clean code, SEO optimization, and mobile-first design. Includes: component-based architecture, state management, API integration, and deployment assistance.',
                'price': 150, 'delivery_days': 5, 'tags': 'react,website,responsive,frontend', 'revisions': 3,
                'total_orders': 28, 'average_rating': 4.8,
            },
            {
                'seller': 'rahul_dev', 'category': 'web-development',
                'title': 'I will create a Django REST API backend',
                'description': 'Professional backend development using Django REST Framework. Includes authentication, database design, API documentation, testing, and deployment-ready code.',
                'price': 200, 'delivery_days': 7, 'tags': 'django,api,backend,python', 'revisions': 2,
                'total_orders': 17, 'average_rating': 4.9,
            },
            {
                'seller': 'priya_design', 'category': 'graphic-design',
                'title': 'I will design a stunning logo for your brand',
                'description': 'Get a unique, memorable logo that captures your brand essence. Includes multiple concepts, unlimited revisions, and all source files (AI, PSD, PNG, SVG).',
                'price': 75, 'delivery_days': 3, 'tags': 'logo,branding,design,identity', 'revisions': 5,
                'total_orders': 42, 'average_rating': 4.9,
            },
            {
                'seller': 'priya_design', 'category': 'ui-ux-design',
                'title': 'I will design a modern UI/UX for your app',
                'description': 'Complete UI/UX design for mobile or web apps. Includes user research, wireframes, high-fidelity mockups, interactive prototypes, and design system creation in Figma.',
                'price': 300, 'delivery_days': 10, 'tags': 'ui,ux,figma,prototype,app-design', 'revisions': 3,
                'total_orders': 26, 'average_rating': 4.8,
            },
            {
                'seller': 'amit_writer', 'category': 'content-writing',
                'title': 'I will write SEO blog posts that rank',
                'description': 'High-quality, SEO-optimized blog posts that drive organic traffic. Includes keyword research, engaging content, meta descriptions, and proper formatting.',
                'price': 50, 'delivery_days': 2, 'tags': 'blog,seo,content,writing', 'revisions': 2,
                'total_orders': 22, 'average_rating': 4.6,
            },
            {
                'seller': 'amit_writer', 'category': 'digital-marketing',
                'title': 'I will create a social media marketing strategy',
                'description': 'Comprehensive social media marketing plan including content calendar, audience analysis, competitor research, and growth strategies for Instagram, Twitter, and LinkedIn.',
                'price': 120, 'delivery_days': 4, 'tags': 'social-media,marketing,strategy,growth', 'revisions': 2,
                'total_orders': 10, 'average_rating': 4.5,
            },
            {
                'seller': 'neha_mobile', 'category': 'mobile-development',
                'title': 'I will build a cross-platform mobile app',
                'description': 'Build a beautiful, performant mobile app using React Native or Flutter. Includes UI implementation, API integration, push notifications, and app store deployment.',
                'price': 500, 'delivery_days': 14, 'tags': 'mobile,app,react-native,flutter', 'revisions': 3,
                'total_orders': 15, 'average_rating': 4.7,
            },
            {
                'seller': 'neha_mobile', 'category': 'web-development',
                'title': 'I will build a full-stack MERN application',
                'description': 'End-to-end web application using MongoDB, Express.js, React, and Node.js. Includes authentication, CRUD operations, responsive design, and cloud deployment.',
                'price': 350, 'delivery_days': 10, 'tags': 'mern,fullstack,nodejs,mongodb', 'revisions': 2,
                'total_orders': 23, 'average_rating': 4.8,
            },
        ]

        created_gigs = []
        for gig_data in gigs_data:
            seller = created_users.get(gig_data.pop('seller'))
            category = categories.get(gig_data.pop('category'))
            if seller and category:
                gig, _ = Gig.objects.get_or_create(
                    title=gig_data['title'],
                    seller=seller,
                    defaults={**gig_data, 'category': category}
                )
                created_gigs.append(gig)
                self.stdout.write(f'  ✅ Gig: {gig.title[:50]}...')

        # Create sample orders
        buyer = created_users.get('buyer_john')
        if buyer and created_gigs:
            orders_data = [
                {'gig': created_gigs[0], 'status': 'completed', 'requirements': 'Need a portfolio website with contact form'},
                {'gig': created_gigs[2], 'status': 'completed', 'requirements': 'Logo for my tech startup TechFlow'},
                {'gig': created_gigs[4], 'status': 'in_progress', 'requirements': '5 blog posts about AI trends'},
                {'gig': created_gigs[6], 'status': 'pending', 'requirements': 'Food delivery app for Android and iOS'},
            ]
            created_orders = []
            for order_data in orders_data:
                order, created = Order.objects.get_or_create(
                    gig=order_data['gig'],
                    buyer=buyer,
                    defaults={
                        'status': order_data['status'],
                        'requirements': order_data['requirements'],
                        'amount': order_data['gig'].price,
                    }
                )
                created_orders.append(order)
                if created:
                    self.stdout.write(f'  ✅ Order: #{order.id}')

            # Create reviews for completed orders
            for order in created_orders:
                if order.status == 'completed' and not hasattr(order, 'review'):
                    try:
                        Review.objects.get_or_create(
                            order=order,
                            defaults={
                                'gig': order.gig,
                                'reviewer': buyer,
                                'rating': 5,
                                'comment': f'Amazing work on {order.gig.title}! Delivered on time with excellent quality. Highly recommended!',
                            }
                        )
                        self.stdout.write(f'  ✅ Review for order #{order.id}')
                    except Exception:
                        pass

        # Create superuser
        if not User.objects.filter(is_superuser=True).exists():
            admin_user = User.objects.create_superuser(
                username='admin',
                email='admin@skillbridge.com',
                password='admin123',
            )
            Profile.objects.get_or_create(user=admin_user, defaults={'full_name': 'Admin'})
            self.stdout.write('  ✅ Superuser: admin@skillbridge.com / admin123')

        self.stdout.write(self.style.SUCCESS('\\n🎉 Database seeded successfully!'))
        self.stdout.write(f'  📊 {Category.objects.count()} categories')
        self.stdout.write(f'  👥 {User.objects.count()} users')
        self.stdout.write(f'  💼 {Gig.objects.count()} gigs')
        self.stdout.write(f'  📦 {Order.objects.count()} orders')
        self.stdout.write(f'  ⭐ {Review.objects.count()} reviews')

import {
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  ThumbsUp,
  Users,
  Upload,
  PlayCircle,
  Calendar,
  BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Progress } from '@/shared/ui/progress'
import { useScriptStats } from '@/app/hooks/use-scripts'
import { Link } from 'react-router-dom'
import { ROUTES } from '@/shared/constants'

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useScriptStats()

  const mockStats = [
    {
      title: 'Scripts Ready',
      value: stats?.data?.script_ready || 8,
      change: '+12%',
      trend: 'up' as const,
      icon: PlayCircle,
      color: 'from-blue-500 to-blue-600',
      description: 'Ready for processing'
    },
    {
      title: 'Processing',
      value: 3,
      change: '+2',
      trend: 'up' as const,
      icon: Clock,
      color: 'from-yellow-500 to-orange-500',
      description: 'Currently uploading'
    },
    {
      title: 'Published',
      value: stats?.data?.uploaded || 47,
      change: '+18%',
      trend: 'up' as const,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      description: 'Live on YouTube'
    },
    {
      title: 'Total Views',
      value: '125K',
      change: '+23%',
      trend: 'up' as const,
      icon: Eye,
      color: 'from-purple-500 to-purple-600',
      description: 'This month'
    }
  ]

  const recentActivities = [
    {
      id: 1,
      type: 'upload',
      title: '건강한 아침 운동법',
      status: 'completed',
      time: '2분 전',
      views: '1.2K'
    },
    {
      id: 2,
      type: 'processing',
      title: '맛있는 김치찌개 레시피',
      status: 'processing',
      time: '15분 전',
      progress: 75
    },
    {
      id: 3,
      type: 'scheduled',
      title: '시니어를 위한 스마트폰 사용법',
      status: 'scheduled',
      time: '오늘 18:00',
      scheduledTime: '2024-01-16 18:00'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing': return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-500" />
      default: return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  if (statsLoading) {
    return (
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="glass border-border/50">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Welcome back! 👋
              </h2>
              <p className="text-lg text-muted-foreground">
                Your YouTube automation is running smoothly.{' '}
                <span className="text-primary font-semibold">
                  {stats?.data?.script_ready || 8} scripts
                </span>{' '}
                ready for processing.
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                <Activity className="w-12 h-12 text-primary" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {mockStats.map((stat) => (
          <Card key={stat.title} className="glass card-hover border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-green-500 text-sm">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.change}
                </div>
                <span className="text-xs text-muted-foreground">
                  {stat.description}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="glass border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-foreground">
                  Recent Activity
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to={ROUTES.SCRIPT_MANAGEMENT}>
                    View All
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-accent/30 border border-border/50 card-hover"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(activity.status)}
                      <div>
                        <h4 className="font-medium text-foreground">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {activity.status === 'completed' && activity.views && (
                        <div className="flex items-center text-sm text-green-500">
                          <Eye className="w-4 h-4 mr-1" />
                          {activity.views}
                        </div>
                      )}

                      {activity.status === 'processing' && activity.progress && (
                        <div className="flex items-center space-x-2">
                          <Progress value={activity.progress} className="w-20" />
                          <span className="text-sm text-muted-foreground">
                            {activity.progress}%
                          </span>
                        </div>
                      )}

                      {activity.status === 'scheduled' && (
                        <Button variant="outline" size="sm">
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg" asChild>
                <Link to={ROUTES.SCRIPT_UPLOAD}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Script
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <PlayCircle className="w-4 h-4 mr-2" />
                Process Queue
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Uploads
              </Button>
            </CardContent>
          </Card>

          {/* Performance Card */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-muted-foreground">Total Views</span>
                  </div>
                  <span className="font-semibold text-foreground">125.3K</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ThumbsUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-muted-foreground">Likes</span>
                  </div>
                  <span className="font-semibold text-foreground">8.7K</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-muted-foreground">Subscribers</span>
                  </div>
                  <span className="font-semibold text-foreground">+892</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-muted-foreground">Engagement</span>
                  </div>
                  <span className="font-semibold text-foreground">94.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
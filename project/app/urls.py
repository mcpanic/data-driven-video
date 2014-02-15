from django.conf.urls import patterns, include, url

from app import views

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'project.views.home', name='home'),
    # url(r'^project/', include('project.foo.urls')),

	url(r'^player/(?P<vid>\w+)/$', views.player, name='player'),
	url(r'^prototype/(?P<vid>\w+)/$', views.prototype_interface, name='prototype_interface'),
	url(r'^video-single/(?P<vid>\w+)/$', views.video_single, name='video_single'),
	url(r'^video-list/$', views.video_list, name='video_list'),		
	url(r'^process-data/$', views.process_data, name='process_data'),	

	url(r'^data-dashboard/$', views.data_dashboard, name='data_dashboard'),
	url(r'^heatmap-dashboard/$', views.heatmap_dashboard, name='heatmap_dashboard'),
	url(r'^export-heatmaps/$', views.export_heatmaps, name='export_heatmaps'),

)

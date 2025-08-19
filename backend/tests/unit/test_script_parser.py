"""
ScriptParser 테스트
"""

import pytest
from app.services.script_parser import ScriptParser, ScriptParsingError


def create_test_script_content():
    """테스트용 대본 콘텐츠 생성"""
    return """
=== 대본 ===
안녕하세요, 시청자 여러분! 오늘은 60년 만에 처음 공개하는 할머니의 숨겨진 이야기를 들려드리려고 합니다.

1960년대 초, 아직 어린 신부였던 할머니는 시댁 살이가 힘들어 몰래 친정에 편지를 썼습니다. 
하지만 그 편지는 시어머니에게 발각되고 말았죠. 

그날 밤, 할머니는 혼자 마당에 앉아 눈물을 흘리며 다짐했습니다.
"언젠가 내 손주들에게는 이런 마음의 짐을 주지 않겠다."

그 약속을 지키기 위해 할머니가 선택한 방법은 무엇이었을까요?
오늘 영상에서 그 감동적인 이야기를 공개합니다.

=== 메타데이터 ===
제목: 60년 만에 밝히는 할머니의 비밀 - 시댁살이 고충과 가족 사랑
설명: 1960년대 어린 신부였던 할머니의 진솔한 이야기를 통해 그 시대 여성들의 삶과 가족에 대한 깊은 사랑을 느껴보세요. 
현재를 살아가는 시니어 세대에게 위로와 공감을 전하는 따뜻한 영상입니다.
태그: 시니어, 할머니, 1960년대, 가족, 시댁살이, 회상, 감동, 한국사, 여성사

=== 썸네일 제작 ===
텍스트: 60년 만에 공개하는 할머니의 비밀
ImageFX 프롬프트: 1960년대 한국의 전통 한옥 마당에서 한복을 입은 젊은 여성이 달빛 아래 혼자 앉아 편지를 읽고 있는 따뜻하고 감성적인 장면, 빈티지 톤, 따뜻한 조명
"""


class TestScriptParser:
    """ScriptParser 테스트 클래스"""
    
    def test_basic_parsing(self):
        """기본 파싱 기능 테스트"""
        parser = ScriptParser()
        test_content = create_test_script_content()
        
        result = parser.parse_script_file(test_content)
        
        assert result is not None
        assert 'content' in result
        assert 'title' in result
        assert 'description' in result
        assert 'tags' in result
        assert 'thumbnail_text' in result
        assert 'imagefx_prompt' in result
        
        assert result['title'] == "60년 만에 밝히는 할머니의 비밀 - 시댁살이 고충과 가족 사랑"
        assert "안녕하세요, 시청자 여러분!" in result['content']
        assert "시니어, 할머니" in result['tags']


    def test_validation(self):
        """데이터 유효성 검증 테스트"""
        parser = ScriptParser()
        
        # 정상 데이터 테스트
        valid_data = {
            'content': '테스트 대본 내용',
            'title': '테스트 제목',
            'description': '테스트 설명',
            'tags': '테스트, 태그'
        }
        
        assert parser.validate_parsed_data(valid_data) is True
        
        # 필수 필드 누락 테스트
        invalid_data = {
            'description': '설명만 있음',
            'tags': '태그만, 있음'
        }
        
        assert parser.validate_parsed_data(invalid_data) is False
        
        # 제목 길이 초과 테스트
        long_title_data = {
            'content': '내용',
            'title': 'A' * 101,  # 101자 제목
            'description': '설명'
        }
        
        assert parser.validate_parsed_data(long_title_data) is False


    def test_error_handling(self):
        """에러 처리 테스트"""
        parser = ScriptParser()
        
        # 빈 내용 테스트
        with pytest.raises(ScriptParsingError):
            parser.parse_script_file("")
        
        # 대본 섹션 없음 테스트
        with pytest.raises(ScriptParsingError):
            parser.parse_script_file("=== 메타데이터 ===\n제목: 테스트")
        
        # 제목 없음 테스트
        with pytest.raises(ScriptParsingError):
            parser.parse_script_file("=== 대본 ===\n테스트 내용\n=== 메타데이터 ===\n설명: 설명만")


    def test_edge_cases(self):
        """경계 케이스 테스트"""
        parser = ScriptParser()
        
        # 최소한의 정보만 있는 케이스
        minimal_content = """
=== 대본 ===
최소한의 대본 내용입니다.

=== 메타데이터 ===
제목: 최소 제목
"""
        
        result = parser.parse_script_file(minimal_content)
        assert result is not None
        assert result['title'] == "최소 제목"
        assert result['content'] == "최소한의 대본 내용입니다."
        
        # 공백이 많은 케이스
        whitespace_content = """

    === 대본 ===
    
    
    공백이 많은 대본 내용입니다.
    
    
    === 메타데이터 ===
    
    제목   :   공백 테스트 제목   
    설명   :   공백이 많은 설명입니다   
    태그   :   공백 , 테스트 , 태그   
    
    """
        
        result = parser.parse_script_file(whitespace_content)
        assert result is not None
        assert result['title'].strip() == "공백 테스트 제목"
        assert "공백이 많은 설명입니다" in result.get('description', '')
        assert "공백" in result.get('tags', '')
    
    def test_alternative_thumbnail_section(self):
        """썸네일 정보/썸네일 제작 섹션 대안 형식 테스트"""
        parser = ScriptParser()
        
        # "썸네일 정보" 섹션
        content_with_info = """
=== 대본 ===
테스트 대본 내용

=== 메타데이터 ===
제목: 테스트 제목

=== 썸네일 정보 ===
텍스트: 정보 섹션 텍스트
ImageFX 프롬프트: 정보 섹션 프롬프트
"""
        
        result = parser.parse_script_file(content_with_info)
        assert result['thumbnail_text'] == "정보 섹션 텍스트"
        assert result['imagefx_prompt'] == "정보 섹션 프롬프트"
        
        # "썸네일 제작" 섹션
        content_with_creation = """
=== 대본 ===
테스트 대본 내용

=== 메타데이터 ===
제목: 테스트 제목

=== 썸네일 제작 ===
텍스트: 제작 섹션 텍스트
ImageFX 프롬프트: 제작 섹션 프롬프트
"""
        
        result = parser.parse_script_file(content_with_creation)
        assert result['thumbnail_text'] == "제작 섹션 텍스트"
        assert result['imagefx_prompt'] == "제작 섹션 프롬프트"